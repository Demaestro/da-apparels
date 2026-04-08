import { Processor, Process } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { Resend } from "resend";
import { ConfigService } from "@nestjs/config";

export const EMAIL_QUEUE = "email-queue";

export type EmailJob =
  | { type: "ORDER_CONFIRMED"; to: string; orderNumber: string; totalAmount: string }
  | { type: "STATUS_UPDATE"; to: string; orderNumber: string; newStatus: string }
  | { type: "DELIVERY_REMINDER"; to: string; orderNumber: string; scheduledAt: string };

/**
 * BullMQ email worker — runs in a separate process from the main API.
 * Ensures order emails don't block the request-response cycle.
 */
@Processor(EMAIL_QUEUE)
export class EmailWorker {
  private readonly logger = new Logger(EmailWorker.name);
  private readonly resend: Resend;

  constructor(private config: ConfigService) {
    this.resend = new Resend(this.config.getOrThrow("RESEND_API_KEY"));
  }

  @Process()
  async handle(job: Job<EmailJob>) {
    const { data } = job;
    this.logger.log(`Processing email job: ${data.type} for ${data.to}`);

    try {
      switch (data.type) {
        case "ORDER_CONFIRMED":
          await this.resend.emails.send({
            from: this.config.getOrThrow("EMAIL_FROM"),
            to: data.to,
            subject: `Your DA Apparels Order ${data.orderNumber} is Confirmed`,
            html: this.buildOrderConfirmedEmail(data.orderNumber, data.totalAmount),
          });
          break;

        case "STATUS_UPDATE":
          await this.resend.emails.send({
            from: this.config.getOrThrow("EMAIL_FROM"),
            to: data.to,
            subject: `Order ${data.orderNumber} Update — ${data.newStatus.replace(/_/g, " ")}`,
            html: this.buildStatusUpdateEmail(data.orderNumber, data.newStatus),
          });
          break;

        case "DELIVERY_REMINDER":
          await this.resend.emails.send({
            from: this.config.getOrThrow("EMAIL_FROM"),
            to: data.to,
            subject: `Your DA Apparels Delivery is Scheduled`,
            html: this.buildDeliveryReminderEmail(data.orderNumber, data.scheduledAt),
          });
          break;
      }
    } catch (err) {
      this.logger.error(`Email job failed: ${(err as Error).message}`, (err as Error).stack);
      throw err; // BullMQ will retry based on queue config
    }
  }

  private buildOrderConfirmedEmail(orderNumber: string, total: string) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Your order is confirmed.</h1>
        <p>Order <strong>${orderNumber}</strong> — Total: <strong>${total}</strong></p>
        <p>Our artisans have received your order and production begins shortly. You will receive status updates as your piece is crafted.</p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels · Owerri, Nigeria</p>
      </div>
    `;
  }

  private buildStatusUpdateEmail(orderNumber: string, status: string) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Your order status has been updated.</h1>
        <p>Order <strong>${orderNumber}</strong> is now: <strong>${status.replace(/_/g, " ")}</strong></p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels · Owerri, Nigeria</p>
      </div>
    `;
  }

  private buildDeliveryReminderEmail(orderNumber: string, scheduledAt: string) {
    return `
      <div style="font-family: Georgia, serif; color: #0A0A0A; max-width: 600px; margin: 0 auto;">
        <p style="color: #C9A94A; letter-spacing: 0.2em; font-size: 12px; text-transform: uppercase;">DA Apparels</p>
        <h1 style="font-weight: 300;">Your delivery is on its way.</h1>
        <p>Order <strong>${orderNumber}</strong> is scheduled for delivery on <strong>${scheduledAt}</strong>.</p>
        <hr style="border-color: #C9A94A33; margin: 32px 0;" />
        <p style="font-size: 12px; color: #787878;">DA Apparels · Owerri, Nigeria</p>
      </div>
    `;
  }
}
