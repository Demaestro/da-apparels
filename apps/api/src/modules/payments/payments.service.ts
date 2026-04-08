import {
  Injectable, BadRequestException, NotFoundException, Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { PrismaService } from "../../lib/prisma.service";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  // ── Initiate payment (returns URL to redirect user) ─────────────────────────

  async initiate(orderId: string, userId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId, status: OrderStatus.PENDING_PAYMENT },
      include: { user: { select: { email: true } } },
    });

    if (!order) throw new NotFoundException("Order not found or already paid.");

    // Paystack initialise — swap for Flutterwave if preferred
    const paystackSecret = this.config.getOrThrow("PAYSTACK_SECRET_KEY");
    const response = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${paystackSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: order.user.email,
        amount: Math.round(Number(order.totalAmount) * 100), // kobo
        reference: order.orderNumber,
        metadata: { orderId: order.id, orderNumber: order.orderNumber },
        callback_url: `${this.config.get("NEXT_PUBLIC_APP_URL")}/checkout/success`,
      }),
    });

    const json = (await response.json()) as { status: boolean; data: { authorization_url: string; reference: string } };
    if (!json.status) throw new BadRequestException("Payment initiation failed.");

    // Create pending payment record
    await this.prisma.payment.create({
      data: {
        orderId,
        provider: "paystack",
        providerRef: json.data.reference,
        amount: order.totalAmount,
        currency: order.currency,
        status: "pending",
      },
    });

    return { authorizationUrl: json.data.authorization_url, reference: json.data.reference };
  }

  // ── Paystack webhook (HMAC-SHA512 verified) ─────────────────────────────────

  async handlePaystackWebhook(rawBody: Buffer, signature: string) {
    const secret = this.config.getOrThrow("PAYSTACK_SECRET_KEY");
    const hash = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");

    if (hash !== signature) {
      this.logger.warn("Paystack webhook signature mismatch — rejected.");
      throw new BadRequestException("Invalid webhook signature.");
    }

    const event = JSON.parse(rawBody.toString()) as {
      event: string;
      data: { reference: string; status: string };
    };

    if (event.event !== "charge.success") return;

    const payment = await this.prisma.payment.findFirst({
      where: { providerRef: event.data.reference },
      include: { order: true },
    });

    if (!payment || payment.status === "success") return;

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

    this.logger.log(`Payment confirmed for order: ${payment.order.orderNumber}`);
  }
}
