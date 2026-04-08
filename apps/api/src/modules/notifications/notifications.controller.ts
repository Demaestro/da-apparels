import { Controller, Get, Patch, Param, Query, Req, UseGuards } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";

@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  async list(
    @Req() req: { user: { id: string } },
    @Query("unread") unread?: string,
  ) {
    return { success: true, data: await this.notifications.getForUser(req.user.id, unread === "true") };
  }

  @Patch(":id/read")
  async markRead(@Param("id") id: string, @Req() req: { user: { id: string } }) {
    await this.notifications.markRead(id, req.user.id);
    return { success: true };
  }

  @Patch("read-all")
  async markAllRead(@Req() req: { user: { id: string } }) {
    await this.notifications.markAllRead(req.user.id);
    return { success: true };
  }
}
