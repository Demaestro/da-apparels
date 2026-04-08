import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { PrismaService } from "../../lib/prisma.service";
import { OrderStatus, Prisma } from "@prisma/client";
import { SubmitManualProofDto } from "./dto/submit-manual-proof.dto";
import { EMAIL_QUEUE, type EmailJob } from "../../workers/email.worker";

type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url: string;
    reference: string;
  };
};

type ManualPaymentDetails = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  transferReference: string;
};

type PaymentInitiationResult =
  | {
      flow: "redirect";
      provider: "paystack";
      authorizationUrl: string;
      reference: string;
    }
  | {
      flow: "manual";
      provider: "manual";
      reference: string;
      message: string;
      bankName: string;
      accountName: string;
      accountNumber: string;
      transferReference: string;
      contactEmail?: string;
      contactWhatsApp?: string;
    };

type ManualPaymentProofResult = {
  acknowledged: true;
  orderNumber: string;
  transferReference: string;
  supportEmail?: string;
  contactWhatsApp?: string;
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue<EmailJob>,
  ) {}

  async initiate(orderId: string, userId: string): Promise<PaymentInitiationResult> {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: OrderStatus.PENDING_PAYMENT },
      include: {
        user: { select: { email: true } },
      },
    });

    if (!order) {
      throw new NotFoundException("Order not found or already paid.");
    }

    const callbackUrl = `${this.config.get("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000"}/checkout/success`;
    const paystackSecret = this.getRealConfigValue("PAYSTACK_SECRET_KEY");

    if (!paystackSecret) {
      const contactEmail = this.getSupportEmail();
      const contactWhatsApp = this.getSupportWhatsApp();
      const manualPayment = this.getManualPaymentDetails(order.orderNumber);

      await this.prisma.payment.upsert({
        where: { orderId },
        update: {
          provider: "manual",
          providerRef: order.orderNumber,
          amount: order.totalAmount,
          currency: order.currency,
          status: "pending",
          paidAt: null,
          metadata: {
            mode: "manual-review",
            contactEmail,
            contactWhatsApp,
            bankName: manualPayment.bankName,
            accountName: manualPayment.accountName,
            accountNumber: manualPayment.accountNumber,
            transferReference: manualPayment.transferReference,
            callbackUrl,
          },
        },
        create: {
          orderId,
          provider: "manual",
          providerRef: order.orderNumber,
          amount: order.totalAmount,
          currency: order.currency,
          status: "pending",
          metadata: {
            mode: "manual-review",
            contactEmail,
            contactWhatsApp,
            bankName: manualPayment.bankName,
            accountName: manualPayment.accountName,
            accountNumber: manualPayment.accountNumber,
            transferReference: manualPayment.transferReference,
            callbackUrl,
          },
        },
      });

      await this.emailQueue.add(
        {
          type: "MANUAL_PAYMENT_INSTRUCTIONS",
          to: order.user.email,
          orderNumber: order.orderNumber,
          totalAmount: String(order.totalAmount),
          bankName: manualPayment.bankName,
          accountName: manualPayment.accountName,
          accountNumber: manualPayment.accountNumber,
          transferReference: manualPayment.transferReference,
          contactEmail,
          contactWhatsApp,
        },
        {
          attempts: 1,
          removeOnComplete: true,
        },
      );

      if (contactEmail) {
        await this.emailQueue.add(
          {
            type: "MANUAL_PAYMENT_ALERT",
            to: contactEmail,
            customerEmail: order.user.email,
            orderNumber: order.orderNumber,
            totalAmount: String(order.totalAmount),
          },
          {
            attempts: 1,
            removeOnComplete: true,
          },
        );
      }

      return {
        flow: "manual",
        provider: "manual",
        reference: order.orderNumber,
        message:
          "Online card payment is not available yet. Your order has been reserved and you can complete payment by bank transfer.",
        bankName: manualPayment.bankName,
        accountName: manualPayment.accountName,
        accountNumber: manualPayment.accountNumber,
        transferReference: manualPayment.transferReference,
        contactEmail,
        contactWhatsApp,
      };
    }

    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: order.user.email,
        amount: Math.round(Number(order.totalAmount) * 100),
        reference: order.orderNumber,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
        callback_url: callbackUrl,
      }),
    });

    const json = (await response.json()) as PaystackInitializeResponse;
    if (!response.ok || !json.status || !json.data) {
      throw new BadRequestException(json.message ?? "Payment initiation failed.");
    }

    await this.prisma.payment.upsert({
      where: { orderId },
      update: {
        provider: "paystack",
        providerRef: json.data.reference,
        amount: order.totalAmount,
        currency: order.currency,
        status: "pending",
        paidAt: null,
        metadata: { callbackUrl },
      },
      create: {
        orderId,
        provider: "paystack",
        providerRef: json.data.reference,
        amount: order.totalAmount,
        currency: order.currency,
        status: "pending",
        metadata: { callbackUrl },
      },
    });

    return {
      flow: "redirect",
      provider: "paystack",
      authorizationUrl: json.data.authorization_url,
      reference: json.data.reference,
    };
  }

  async handlePaystackWebhook(rawBody: Buffer, signature: string) {
    const secret = this.getRealConfigValue("PAYSTACK_SECRET_KEY");
    if (!secret) {
      this.logger.warn("Paystack webhook ignored because PAYSTACK_SECRET_KEY is not configured.");
      return;
    }
    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

    if (hash !== signature) {
      this.logger.warn("Paystack webhook signature mismatch; rejected.");
      throw new BadRequestException("Invalid webhook signature.");
    }

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      data: { reference: string; status: string };
    };

    if (event.event !== "charge.success") {
      return;
    }

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: event.data.reference },
      include: {
        order: {
          include: {
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!payment || payment.status === "success") {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "success", paidAt: new Date() },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: OrderStatus.PAYMENT_CONFIRMED },
      });
      await tx.orderTimeline.create({
        data: {
          orderId: payment.orderId,
          status: OrderStatus.PAYMENT_CONFIRMED,
          createdBy: "paystack-webhook",
        },
      });
    });

    await this.emailQueue.add(
      {
        type: "ORDER_CONFIRMED",
        to: payment.order.user.email,
        orderNumber: payment.order.orderNumber,
        totalAmount: String(payment.order.totalAmount),
      },
      {
        attempts: 3,
        backoff: { type: "exponential", delay: 3000 },
        removeOnComplete: true,
      },
    );

    this.logger.log(`Payment confirmed for order: ${payment.order.orderNumber}`);
  }

  async submitManualProof(
    orderId: string,
    userId: string,
    dto: SubmitManualProofDto,
  ): Promise<ManualPaymentProofResult> {
    const record = await this.prisma.payment.findFirst({
      where: {
        orderId,
        provider: "manual",
        order: { userId },
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            totalAmount: true,
            user: { select: { email: true } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException("Manual payment record not found for this order.");
    }

    if (record.status === "success") {
      throw new BadRequestException("This order has already been confirmed as paid.");
    }

    const supportEmail = this.getSupportEmail();
    const contactWhatsApp = this.getSupportWhatsApp();
    const existingMetadata = this.toJsonObject(record.metadata);
    const nextMetadata: Prisma.InputJsonValue = {
      ...existingMetadata,
      manualProof: {
        submittedAt: new Date().toISOString(),
        transferReference: dto.transferReference,
        senderName: dto.senderName ?? null,
        notes: dto.notes ?? null,
      },
    };

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: record.id },
        data: {
          providerRef: dto.transferReference,
          metadata: nextMetadata,
        },
      });

      await tx.orderTimeline.create({
        data: {
          orderId: record.order.id,
          status: OrderStatus.PENDING_PAYMENT,
          createdBy: userId,
          note: `Manual transfer submitted for review. Reference: ${dto.transferReference}`,
        },
      });
    });

    if (supportEmail) {
      await this.emailQueue.add(
        {
          type: "MANUAL_PAYMENT_PROOF_ALERT",
          to: supportEmail,
          orderNumber: record.order.orderNumber,
          totalAmount: String(record.order.totalAmount),
          customerEmail: record.order.user.email,
          transferReference: dto.transferReference,
          senderName: dto.senderName,
          notes: dto.notes,
        },
        {
          attempts: 1,
          removeOnComplete: true,
        },
      );
    }

    await this.emailQueue.add(
      {
        type: "MANUAL_PAYMENT_PROOF_RECEIVED",
        to: record.order.user.email,
        orderNumber: record.order.orderNumber,
        transferReference: dto.transferReference,
        contactEmail: supportEmail,
        contactWhatsApp,
      },
      {
        attempts: 1,
        removeOnComplete: true,
      },
    );

    return {
      acknowledged: true,
      orderNumber: record.order.orderNumber,
      transferReference: dto.transferReference,
      supportEmail,
      contactWhatsApp,
    };
  }

  private getSupportEmail() {
    return (
      this.getRealConfigValue("SUPPORT_EMAIL") ??
      this.getRealConfigValue("NEXT_PUBLIC_SUPPORT_EMAIL") ??
      this.getRealConfigValue("EMAIL_FROM")
    );
  }

  private getSupportWhatsApp() {
    return this.getRealConfigValue("SUPPORT_WHATSAPP") ?? undefined;
  }

  private getManualPaymentDetails(reference: string): ManualPaymentDetails {
    const bankName = this.config.get<string>("MANUAL_PAYMENT_BANK_NAME")?.trim();
    const accountName = this.config.get<string>("MANUAL_PAYMENT_ACCOUNT_NAME")?.trim();
    const accountNumber = this.config.get<string>("MANUAL_PAYMENT_ACCOUNT_NUMBER")?.trim();

    if (!bankName || !accountName || !accountNumber) {
      throw new BadRequestException(
        "Manual payment is not configured. Please contact support to complete your order.",
      );
    }

    return { bankName, accountName, accountNumber, transferReference: reference };
  }

  private toJsonObject(value: Prisma.JsonValue | null | undefined) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {} as Record<string, Prisma.JsonValue>;
    }

    return value as Record<string, Prisma.JsonValue>;
  }

  private getRealConfigValue(key: string) {
    const value = this.config.get<string>(key)?.trim();
    if (!value) {
      return undefined;
    }

    const normalized = value.toLowerCase();
    if (
      ["demo"].includes(normalized) ||
      ["replace-with", "placeholder", "your-", "example", "local-placeholder"].some((token) =>
        normalized.includes(token),
      )
    ) {
      return undefined;
    }

    return value;
  }
}
