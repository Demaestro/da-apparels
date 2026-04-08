import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../lib/prisma.service";
import { OrderStatus } from "@prisma/client";

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ── CRM Analytics dashboard ─────────────────────────────────────────────────

  async getAnalytics(period: "7d" | "30d" | "90d" | "all" = "30d") {
    const since = this.periodToDate(period);

    const [
      totalRevenue,
      orderCount,
      ordersByStatus,
      newCustomers,
      topProducts,
      fabricTracking,
    ] = await Promise.all([
      // Total confirmed revenue
      this.prisma.order.aggregate({
        where: {
          status: { not: OrderStatus.CANCELLED },
          createdAt: since ? { gte: since } : undefined,
        },
        _sum: { totalAmount: true },
        _count: true,
      }),

      // Order count
      this.prisma.order.count({
        where: { createdAt: since ? { gte: since } : undefined },
      }),

      // Orders by status
      this.prisma.order.groupBy({
        by: ["status"],
        _count: { _all: true },
        where: { createdAt: since ? { gte: since } : undefined },
      }),

      // New customer count
      this.prisma.user.count({
        where: {
          role: "CUSTOMER",
          createdAt: since ? { gte: since } : undefined,
        },
      }),

      // Top 10 products by units sold
      this.prisma.orderItem.groupBy({
        by: ["productId", "productName"],
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 10,
        where: {
          order: {
            status: { not: OrderStatus.CANCELLED },
            createdAt: since ? { gte: since } : undefined,
          },
        },
      }),

      // Fabric selection frequency
      this.prisma.orderItemFabric.groupBy({
        by: ["fabricOptionId"],
        _count: { _all: true },
        orderBy: { _count: { fabricOptionId: "desc" } },
        take: 10,
      }),
    ]);

    const aov =
      orderCount > 0
        ? Number(totalRevenue._sum.totalAmount ?? 0) / orderCount
        : 0;

    // Enrich fabric tracking with names
    const fabricIds = fabricTracking.map((f) => f.fabricOptionId);
    const fabrics = await this.prisma.fabricOption.findMany({
      where: { id: { in: fabricIds } },
      select: { id: true, name: true, category: true },
    });
    const fabricMap = Object.fromEntries(fabrics.map((f) => [f.id, f]));

    return {
      period,
      revenue: {
        total: totalRevenue._sum.totalAmount ?? 0,
        currency: "NGN",
      },
      orders: {
        total: orderCount,
        byStatus: ordersByStatus.map((s) => ({
          status: s.status,
          count: s._count._all,
        })),
        aov,
      },
      customers: { newInPeriod: newCustomers },
      topProducts: topProducts.map((p) => ({
        productId: p.productId,
        productName: p.productName,
        unitsSold: p._sum.quantity ?? 0,
        revenue: p._sum.totalPrice ?? 0,
      })),
      fabricTracking: fabricTracking.map((f) => ({
        ...fabricMap[f.fabricOptionId],
        timesSelected: f._count._all,
      })),
    };
  }

  // ── Customer list ────────────────────────────────────────────────────────────

  async getCustomers(page = 1, limit = 25, search?: string) {
    const skip = (page - 1) * limit;
    const where = {
      role: "CUSTOMER" as const,
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { profile: { firstName: { contains: search, mode: "insensitive" as const } } },
          { profile: { lastName: { contains: search, mode: "insensitive" as const } } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          createdAt: true,
          lastLoginAt: true,
          profile: { select: { firstName: true, lastName: true, phone: true, city: true } },
          _count: { select: { orders: true } },
          orders: {
            where: { status: { not: OrderStatus.CANCELLED } },
            select: { totalAmount: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const enriched = customers.map((c) => ({
      ...c,
      totalSpend: c.orders.reduce((sum, o) => sum + Number(o.totalAmount), 0),
      orders: undefined, // don't expose full orders list here
    }));

    return { customers: enriched, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Single customer detail ───────────────────────────────────────────────────

  async getCustomerDetail(customerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        profile: true,
        styleQuizResult: { select: { bodyType: true, preferredStyles: true, occasions: true, takenAt: true } },
        orders: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true, orderNumber: true, status: true,
            totalAmount: true, currency: true, createdAt: true,
          },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!user) return null;

    const totalSpend = user.orders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, o) => sum + Number(o.totalAmount), 0);

    return { ...user, totalSpend };
  }

  // ── All orders (staff view) ──────────────────────────────────────────────────

  async getAllOrders(
    page = 1,
    limit = 25,
    status?: OrderStatus,
    countdownOnly = false,
  ) {
    const skip = (page - 1) * limit;
    const where = {
      ...(status && { status }),
      // "countdown" — orders in production with a deadline approaching
      ...(countdownOnly && {
        status: OrderStatus.IN_PRODUCTION,
        productionDeadline: { gte: new Date() },
      }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: countdownOnly
          ? { productionDeadline: "asc" }
          : { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          currency: true,
          productionDeadline: true,
          deliveryScheduledAt: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
          _count: { select: { items: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { orders, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ── Manual notification trigger ──────────────────────────────────────────────

  async triggerNotification(userId: string, subject: string, body: string) {
    return this.prisma.notification.create({
      data: {
        userId,
        channel: "IN_APP",
        subject,
        body,
        sentAt: new Date(),
      },
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  private periodToDate(period: string): Date | null {
    const map: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
    const days = map[period];
    if (!days) return null;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d;
  }
}
