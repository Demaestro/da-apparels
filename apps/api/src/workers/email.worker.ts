import { Processor, Process } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { Resend } from "resend";
import { ConfigService } from "@nestjs/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const EMAIL_QUEUE = "email-queue";

export type EmailJob =
  | { type: "ORDER_CONFIRMED"; to: string; orderNumber: string; totalAmount: string }
  | { type: "STATUS_UPDATE"; to: string; orderNumber: string; newStatus: string }
  | { type: "DELIVERY_REMINDER"; to: string; orderNumber: string; scheduledAt: string }
  | { type: "PASSWORD_RESET"; to: string; resetUrl: string; firstName?: string }
  | {
      type: "MANUAL_PAYMENT_INSTRUCTIONS";
      to: string;
      orderNumber: string;
      totalAmount: string;
      bankName: string;
      accountName: string;
      accountNumber: string;
      transferReference: string;
      contactEmail?: string;
      contactWhatsApp?: string;
    }
  | {
      type: "MANUAL_PAYMENT_ALERT";
      to: string;
      orderNumber: string;
      totalAmount: string;
      customerEmail: string;
    }
  | {
      type: "MANUAL_PAYMENT_PROOF_ALERT";
      to: string;
      orderNumber: string;
      totalAmount: string;
      customerEmail: string;
      transferReference: string;
      senderName?: string;
      notes?: string;
    }
  | {
      type: "MANUAL_PAYMENT_PROOF_RECEIVED";
      to: string;
      orderNumber: string;
      transferReference: string;
      contactEmail?: string;
      contactWhatsApp?: string;
    };

type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  html: string;
};

@Processor(EMAIL_QUEUE)
export class EmailWorker {
  private readonly logger = new Logger(EmailWorker.name);
  private readonly resend?: Resend;
  private readonly emailFrom: string;

  constructor(private config: ConfigService) {
    this.emailFrom = this.config.getOrThrow("EMAIL_FROM");
    const resendKey = this.getRealConfigValue("RESEND_API_KEY");
    if (resendKey) {
      this.resend = new Resend(resendKey);
    } else {
      this.logger.warn("RESEND_API_KEY is not configured. Emails will be written to the local outbox.");
    }
  }

  @Process()
  async handle(job: Job<EmailJob>) {
    const { data } = job;
    this.logger.log(`Processing email job: ${data.type} for ${data.to}`);

    try {
      let payload: EmailPayload;

      switch (data.type) {
        case "ORDER_CONFIRMED":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: `Your DA Apparels order ${data.orderNumber} is confirmed`,
            html: this.buildOrderConfirmedEmail(data.orderNumber, data.totalAmount),
          };
          break;

        case "STATUS_UPDATE":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: `Order ${data.orderNumber} update: ${data.newStatus.replace(/_/g, " ")}`,
            html: this.buildStatusUpdateEmail(data.orderNumber, data.newStatus),
          };
          break;

        case "DELIVERY_REMINDER":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: "Your DA Apparels delivery is scheduled",
            html: this.buildDeliveryReminderEmail(data.orderNumber, data.scheduledAt),
          };
          break;

        case "PASSWORD_RESET":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: "Reset your DA Apparels password",
            html: this.buildPasswordResetEmail(data.resetUrl, data.firstName),
          };
          break;

        case "MANUAL_PAYMENT_INSTRUCTIONS":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: `Payment instructions for order ${data.orderNumber}`,
            html: this.buildManualPaymentInstructionsEmail(
              data.orderNumber,
              data.totalAmount,
              data.bankName,
              data.accountName,
              data.accountNumber,
              data.transferReference,
              data.contactEmail,
              data.contactWhatsApp,
            ),
          };
          break;

        case "MANUAL_PAYMENT_ALERT":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: `Manual payment follow-up needed for ${data.orderNumber}`,
            html: this.buildManualPaymentAlertEmail(
              data.orderNumber,
              data.totalAmount,
              data.customerEmail,
            ),
          };
          break;

        case "MANUAL_PAYMENT_PROOF_ALERT":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: `Payment proof received for ${data.orderNumber}`,
            html: this.buildManualPaymentProofAlertEmail(
              data.orderNumber,
              data.totalAmount,
              data.customerEmail,
              data.transferReference,
              data.senderName,
              data.notes,
            ),
          };
          break;

        case "MANUAL_PAYMENT_PROOF_RECEIVED":
          payload = {
            from: this.emailFrom,
            to: data.to,
            subject: `We received your transfer note for ${data.orderNumber}`,
            html: this.buildManualPaymentProofReceivedEmail(
              data.orderNumber,
              data.transferReference,
              data.contactEmail,
              data.contactWhatsApp,
            ),
          };
          break;
      }

      await this.deliver(payload);
    } catch (error) {
      const err = error as Error;
      this.logger.error(`Email job failed: ${err.message}`, err.stack);
      throw err;
    }
  }

  private buildOrderConfirmedEmail(orderNumber: string, total: string) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Your order is confirmed.</h1>
        <p>Order <strong>${this.escapeHtml(orderNumber)}</strong> - Total: <strong>${this.escapeHtml(total)}</strong></p>
        <p>Our artisans have received your order and production begins shortly. You will receive status updates as your piece is crafted.</p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels | Owerri, Nigeria</p>
      </div>
    `;
  }

  private buildStatusUpdateEmail(orderNumber: string, status: string) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Your order status has been updated.</h1>
        <p>Order <strong>${this.escapeHtml(orderNumber)}</strong> is now: <strong>${this.escapeHtml(status.replace(/_/g, " "))}</strong></p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels | Owerri, Nigeria</p>
      </div>
    `;
  }

  private buildDeliveryReminderEmail(orderNumber: string, scheduledAt: string) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Your delivery is on its way.</h1>
        <p>Order <strong>${this.escapeHtml(orderNumber)}</strong> is scheduled for delivery on <strong>${this.escapeHtml(scheduledAt)}</strong>.</p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels | Owerri, Nigeria</p>
      </div>
    `;
  }

  private buildPasswordResetEmail(resetUrl: string, firstName?: string) {
    const greeting = firstName ? `Hello ${this.escapeHtml(firstName)},` : "Hello,";

    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Reset your password</h1>
        <p>${greeting}</p>
        <p>We received a request to reset your DA Apparels password. Use the secure link below to choose a new one.</p>
        <p style="margin: 28px 0;">
          <a href="${this.escapeHtml(resetUrl)}" style="display: inline-block; background: #0A0A0A; color: #F6F1E7; padding: 14px 22px; text-decoration: none; letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px;">Reset password</a>
        </p>
        <p style="font-size: 13px; line-height: 1.6;">
          If the button does not open, copy this link into your browser:<br />
          <a href="${this.escapeHtml(resetUrl)}" style="color: #0A0A0A;">${this.escapeHtml(resetUrl)}</a>
        </p>
        <p style="font-size: 13px; color: #787878;">This link expires in 1 hour. If you did not request it, you can ignore this email.</p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels | Owerri, Nigeria</p>
      </div>
    `;
  }

  private buildManualPaymentInstructionsEmail(
    orderNumber: string,
    total: string,
    bankName: string,
    accountName: string,
    accountNumber: string,
    transferReference: string,
    contactEmail?: string,
    contactWhatsApp?: string,
  ) {
    const supportLine = [
      contactEmail ? `Email us at <a href="mailto:${this.escapeHtml(contactEmail)}">${this.escapeHtml(contactEmail)}</a>` : null,
      contactWhatsApp ? `or message us on WhatsApp at <a href="https://wa.me/${this.escapeHtml(contactWhatsApp)}">${this.escapeHtml(contactWhatsApp)}</a>` : null,
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Your order has been reserved.</h1>
        <p>Order <strong>${this.escapeHtml(orderNumber)}</strong> for <strong>${this.escapeHtml(total)}</strong> has been placed successfully.</p>
        <p>Online card payment is not active yet, so please complete a bank transfer using the details below.</p>
        <div style="background: #F6F1E7; border: 1px solid #C9A94A33; padding: 18px; margin: 24px 0;">
          <p style="margin: 0 0 8px;"><strong>Bank name:</strong> ${this.escapeHtml(bankName)}</p>
          <p style="margin: 0 0 8px;"><strong>Account name:</strong> ${this.escapeHtml(accountName)}</p>
          <p style="margin: 0 0 8px;"><strong>Account number:</strong> ${this.escapeHtml(accountNumber)}</p>
          <p style="margin: 0;"><strong>Payment reference:</strong> ${this.escapeHtml(transferReference)}</p>
        </div>
        <p>Use your order number as the payment reference so we can match the transfer quickly.</p>
        <p>${supportLine || "Our team will contact you shortly with the next step."}</p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels | Owerri, Nigeria</p>
      </div>
    `;
  }

  private buildManualPaymentAlertEmail(orderNumber: string, total: string, customerEmail: string) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Manual payment follow-up needed</h1>
        <p>Order <strong>${this.escapeHtml(orderNumber)}</strong> is awaiting manual payment confirmation.</p>
        <p>Total: <strong>${this.escapeHtml(total)}</strong></p>
        <p>Customer email: <strong>${this.escapeHtml(customerEmail)}</strong></p>
      </div>
    `;
  }

  private buildManualPaymentProofAlertEmail(
    orderNumber: string,
    total: string,
    customerEmail: string,
    transferReference: string,
    senderName?: string,
    notes?: string,
  ) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Manual payment proof received</h1>
        <p>Order <strong>${this.escapeHtml(orderNumber)}</strong> now has a transfer confirmation awaiting review.</p>
        <p>Total: <strong>${this.escapeHtml(total)}</strong></p>
        <p>Customer email: <strong>${this.escapeHtml(customerEmail)}</strong></p>
        <p>Transfer reference: <strong>${this.escapeHtml(transferReference)}</strong></p>
        ${senderName ? `<p>Sender name: <strong>${this.escapeHtml(senderName)}</strong></p>` : ""}
        ${notes ? `<p>Customer note: ${this.escapeHtml(notes)}</p>` : ""}
      </div>
    `;
  }

  private buildManualPaymentProofReceivedEmail(
    orderNumber: string,
    transferReference: string,
    contactEmail?: string,
    contactWhatsApp?: string,
  ) {
    const supportLine = [
      contactEmail ? `Email us at <a href="mailto:${this.escapeHtml(contactEmail)}">${this.escapeHtml(contactEmail)}</a>` : null,
      contactWhatsApp ? `or message us on WhatsApp at <a href="https://wa.me/${this.escapeHtml(contactWhatsApp)}">${this.escapeHtml(contactWhatsApp)}</a>` : null,
    ]
      .filter(Boolean)
      .join(" ");

    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">We received your transfer note.</h1>
        <p>Your payment note for order <strong>${this.escapeHtml(orderNumber)}</strong> has been recorded.</p>
        <p>Reference used: <strong>${this.escapeHtml(transferReference)}</strong></p>
        <p>Our team will review the transfer and confirm your order shortly.</p>
        <p>${supportLine || "Our team will contact you shortly if anything else is needed."}</p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels | Owerri, Nigeria</p>
      </div>
    `;
  }

  private async deliver(payload: EmailPayload) {
    if (this.resend) {
      await this.resend.emails.send(payload);
      return;
    }

    const outboxDir = join(process.cwd(), "..", "..", ".data", "outbox");
    await mkdir(outboxDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const safeRecipient = payload.to.replaceAll(/[^a-zA-Z0-9@._-]/g, "_");
    const baseName = `${stamp}-${safeRecipient}`;

    await writeFile(
      join(outboxDir, `${baseName}.json`),
      JSON.stringify(payload, null, 2),
      "utf8",
    );
    await writeFile(join(outboxDir, `${baseName}.html`), payload.html, "utf8");

    this.logger.log(`Email written to local outbox: ${baseName}`);
  }

  private getRealConfigValue(key: string) {
    const value = this.config.get<string>(key)?.trim();
    if (!value) {
      return undefined;
    }

    const normalized = value.toLowerCase();
    if (["replace-with", "placeholder", "your-", "example", "local-placeholder"].some((token) => normalized.includes(token))) {
      return undefined;
    }

    return value;
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }
}
