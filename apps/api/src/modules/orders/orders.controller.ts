import {
  Controller, Get, Post, Patch, Body, Param, Req, UseGuards,
} from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { ScheduleDeliveryDto } from "./dto/schedule-delivery.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { OrderStatus, type Role } from "@prisma/client";

type AuthRequest = { user: { id: string; role: Role } };

@Controller("orders")
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private orders: OrdersService) {}

  @Post()
  async create(@Req() req: AuthRequest, @Body() dto: CreateOrderDto) {
    return { success: true, data: await this.orders.create(req.user.id, dto) };
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Req() req: AuthRequest) {
    return { success: true, data: await this.orders.findOne(id, req.user.id, req.user.role) };
  }

  @Patch(":id/schedule-delivery")
  async scheduleDelivery(
    @Param("id") id: string,
    @Req() req: AuthRequest,
    @Body() dto: ScheduleDeliveryDto,
  ) {
    return { success: true, data: await this.orders.scheduleDelivery(id, req.user.id, dto) };
  }

  @Patch(":id/status")
  @Roles("STAFF", "ADMIN", "SUPER_ADMIN")
  async updateStatus(
    @Param("id") id: string,
    @Body("status") status: OrderStatus,
    @Body("note") note: string | undefined,
    @Req() req: AuthRequest,
  ) {
    return { success: true, data: await this.orders.updateStatus(id, status, req.user.id, note) };
  }

  @Get(":id/timeline")
  async getTimeline(@Param("id") id: string, @Req() req: AuthRequest) {
    const order = await this.orders.findOne(id, req.user.id, req.user.role);
    return { success: true, data: order.timeline };
  }
}
