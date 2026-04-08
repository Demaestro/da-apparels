import { Controller, Get, Patch, Put, Body, Req, Query, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { UpsertMeasurementsDto } from "./dto/upsert-measurements.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

type AuthRequest = { user: { id: string } };

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Get("me")
  async getMe(@Req() req: AuthRequest) {
    return { success: true, data: await this.users.getMe(req.user.id) };
  }

  @Patch("me/profile")
  async updateProfile(@Req() req: AuthRequest, @Body() dto: UpdateProfileDto) {
    return { success: true, data: await this.users.updateProfile(req.user.id, dto) };
  }

  @Get("me/measurements")
  async getMeasurements(@Req() req: AuthRequest) {
    return { success: true, data: await this.users.getMeasurements(req.user.id) };
  }

  @Put("me/measurements")
  async upsertMeasurements(@Req() req: AuthRequest, @Body() dto: UpsertMeasurementsDto) {
    const result = await this.users.upsertMeasurements(req.user.id, dto);
    return { success: true, data: result, message: "Measurements saved securely." };
  }

  @Get("me/orders")
  async getMyOrders(
    @Req() req: AuthRequest,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    const result = await this.users.getMyOrders(req.user.id, +page, +limit);
    return { success: true, data: result };
  }
}
