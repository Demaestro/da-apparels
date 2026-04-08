import {
  Controller, Post, Body, Param, Req, Res, UseGuards,
  RawBodyRequest, HttpCode, HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";

@Controller("payments")
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("initiate")
  async initiate(
    @Body("orderId") orderId: string,
    @Req() req: { user: { id: string } },
  ) {
    return { success: true, data: await this.payments.initiate(orderId, req.user.id) };
  }

  @Public()
  @Post("webhook/paystack")
  @HttpCode(HttpStatus.OK)
  async paystackWebhook(@Req() req: RawBodyRequest<Request>, @Res() res: Response) {
    const sig = req.headers["x-paystack-signature"] as string;
    await this.payments.handlePaystackWebhook(req.rawBody!, sig);
    res.json({ received: true });
  }
}
