import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { TriggerNotificationDto } from "./dto/trigger-notification.dto";
import { OrderStatus } from "@prisma/client";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  constructor(private admin: AdminService) {}

  // ── CRM Analytics ───────────────────────────────────────────────────────────

  @Get("crm/analytics")
  @Roles("ADMIN", "SUPER_ADMIN")
  async analytics(@Query("period") period: "7d" | "30d" | "90d" | "all" = "30d") {
    return { success: true, data: await this.admin.getAnalytics(period) };
  }

  // ── Customers ───────────────────────────────────────────────────────────────

  @Get("crm/customers")
  @Roles("ADMIN", "SUPER_ADMIN")
  async customers(
    @Query("page") page = 1,
    @Query("limit") limit = 25,
    @Query("search") search?: string,
  ) {
    const result = await this.admin.getCustomers(+page, +limit, search);
    return { success: true, data: result };
  }

  @Get("crm/customers/:id")
  @Roles("ADMIN", "SUPER_ADMIN")
  async customerDetail(@Param("id") id: string) {
    return { success: true, data: await this.admin.getCustomerDetail(id) };
  }

  // ── Orders ──────────────────────────────────────────────────────────────────

  @Get("orders")
  @Roles("STAFF", "ADMIN", "SUPER_ADMIN")
  async orders(
    @Query("page") page = 1,
    @Query("limit") limit = 25,
    @Query("status") status?: OrderStatus,
    @Query("countdown") countdown?: string,
  ) {
    const result = await this.admin.getAllOrders(+page, +limit, status, countdown === "true");
    return { success: true, data: result };
  }

  // ── Fabric tracking ─────────────────────────────────────────────────────────

  @Get("fabric-tracking")
  @Roles("STAFF", "ADMIN", "SUPER_ADMIN")
  async fabricTracking() {
    // Reuse analytics fabric data
    const { fabricTracking } = await this.admin.getAnalytics("all");
    return { success: true, data: fabricTracking };
  }

  // ── Manual notification trigger ─────────────────────────────────────────────

  @Post("notifications/trigger")
  @Roles("ADMIN", "SUPER_ADMIN")
  async triggerNotification(@Body() dto: TriggerNotificationDto) {
    return {
      success: true,
      data: await this.admin.triggerNotification(dto.userId, dto.subject, dto.body),
    };
  }
}
