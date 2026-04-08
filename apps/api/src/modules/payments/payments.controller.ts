import {
  Controller, Post, Body, Req, Res, UseGuards,
  RawBodyRequest, HttpCode, HttpStatus,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { Public } from "../../common/decorators/public.decorator";
import { SubmitManualProofDto } from "./dto/submit-manual-proof.dto";

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

  @UseGuards(JwtAuthGuard)
  @Post("manual-proof")
  async submitManualProof(
    @Body() dto: SubmitManualProofDto,
    @Req() req: { user: { id: string } },
  ) {
    return {
      success: true,
      data: await this.payments.submitManualProof(dto.orderId, req.user.id, dto),
    };
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
