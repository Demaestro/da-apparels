import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import type { Queue } from "bull";
import { PrismaService } from "../../lib/prisma.service";
import type { CreateOrderDto } from "./dto/create-order.dto";
import type { ScheduleDeliveryDto } from "./dto/schedule-delivery.dto";
import { EMAIL_QUEUE, type EmailJob } from "../../workers/email.worker";
import { OrderStatus, type Role } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue(EMAIL_QUEUE) private emailQueue: Queue<EmailJob>,
  ) {}

  // ── Create order ────────────────────────────────────────────────────────────

  async create(userId: string, dto: CreateOrderDto) {
    // 1. Resolve products + variants, validate stock
    const resolvedItems = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { id: true, name: true, basePrice: true, status: true },
        });
        if (!product || product.status !== "ACTIVE") {
          throw new BadRequestException(`Product ${item.productId} is not available.`);
        }

        let priceAdjust = new Decimal(0);
        let sku: string | null = null;

        if (item.variantId) {
          const variant = await this.prisma.productVariant.findFirst({
            where: { id: item.variantId, productId: item.productId },
          });
          if (!variant) throw new BadRequestException(`Variant ${item.variantId} not found.`);
          if (variant.stockQty < item.quantity) {
            throw new BadRequestException(`Insufficient stock for ${product.name}.`);
          }
          priceAdjust = variant.priceAdjust;
          sku = variant.sku;
        }

        if (item.fabricOptionId) {
          const fabric = await this.prisma.fabricOption.findFirst({
            where: { id: item.fabricOptionId, productId: item.productId, inStock: true },
          });
          if (!fabric) throw new BadRequestException(`Fabric option ${item.fabricOptionId} not available.`);
          priceAdjust = priceAdjust.add(fabric.priceAdjust);
        }

        const unitPrice = product.basePrice.add(priceAdjust);
        return {
          ...item,
          productName: product.name,
          unitPrice,
          totalPrice: unitPrice.mul(item.quantity),
          sku,
        };
      }),
    );

    const subtotal = resolvedItems.reduce(
      (sum, i) => sum.add(i.totalPrice),
      new Decimal(0),
    );
    const shippingFee = new Decimal(2500); // flat ₦2,500 — replace with delivery zone logic
    const totalAmount = subtotal.add(shippingFee);
    const orderNumber = await this.generateOrderNumber();

    // 2. Create order in a transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          subtotal,
          shippingFee,
          totalAmount,
          shippingAddress: dto.shippingAddress,
          notes: dto.notes,
          items: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              productName: item.productName,
              sku: item.sku,
              ...(item.fabricOptionId && {
                fabric: {
                  create: {
                    fabricOptionId: item.fabricOptionId,
                    chosenColor: item.fabricColor,
                    customNote: item.fabricNote,
                  },
                },
              }),
            })),
          },
          timeline: {
            create: { status: OrderStatus.PENDING_PAYMENT, createdBy: "system" },
          },
        },
        include: { items: true },
      });

      // Decrement stock for variants
      for (const item of resolvedItems) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stockQty: { decrement: item.quantity } },
          });
        }
      }

      return newOrder;
    });

    this.logger.log(`Order created: ${order.orderNumber}`);
    return order;
  }

  // ── Get single order (with ownership check) ─────────────────────────────────

  async findOne(orderId: string, userId: string, userRole: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { fabric: true } },
        timeline: { orderBy: { createdAt: "asc" } },
        payment: { select: { status: true, provider: true, paidAt: true } },
      },
    });

    if (!order) throw new NotFoundException("Order not found.");

    const isOwner = order.userId === userId;
    const isStaff = ["STAFF", "ADMIN", "SUPER_ADMIN"].includes(userRole);
    if (!isOwner && !isStaff) throw new ForbiddenException("Access denied.");

    return order;
  }

  // ── Schedule delivery ────────────────────────────────────────────────────────

  async scheduleDelivery(orderId: string, userId: string, dto: ScheduleDeliveryDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      select: { id: true, status: true, orderNumber: true },
    });

    if (!order) throw new NotFoundException("Order not found.");
    if (!["QUALITY_CHECK", "READY_FOR_DELIVERY"].includes(order.status)) {
      throw new BadRequestException("Delivery can only be scheduled when order is ready.");
    }

    const deliveryDate = new Date(dto.deliveryDate);
    if (deliveryDate < new Date()) throw new BadRequestException("Delivery date must be in the future.");

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { deliveryScheduledAt: deliveryDate, deliverySlot: dto.slot },
      select: { orderNumber: true, deliveryScheduledAt: true, deliverySlot: true },
    });

    // Get user email for notification
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (user) {
      await this.emailQueue.add({
        type: "DELIVERY_REMINDER",
        to: user.email,
        orderNumber: order.orderNumber,
        scheduledAt: deliveryDate.toLocaleDateString("en-NG", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        }),
      } satisfies EmailJob);
    }

    return updated;
  }

  // ── Update status (staff only) ───────────────────────────────────────────────

  async updateStatus(orderId: string, newStatus: OrderStatus, staffId: string, note?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { email: true } } },
    });
    if (!order) throw new NotFoundException("Order not found.");

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });
      await tx.orderTimeline.create({
        data: { orderId, status: newStatus, note, createdBy: staffId },
      });
      await tx.auditLog.create({
        data: {
          userId: staffId,
          action: "ORDER_STATUS_CHANGED",
          entity: "Order",
          entityId: orderId,
          metadata: { from: order.status, to: newStatus },
        },
      });
      return result;
    });

    // Notify customer via email worker
    await this.emailQueue.add({
      type: "STATUS_UPDATE",
      to: order.user.email,
      orderNumber: order.orderNumber,
      newStatus,
    } satisfies EmailJob);

    return updated;
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.order.count();
    const seq = String(count + 1).padStart(5, "0");
    return `DA-${year}-${seq}`;
  }
}
