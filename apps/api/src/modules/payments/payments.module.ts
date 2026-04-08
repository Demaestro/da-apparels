import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { EMAIL_QUEUE } from "../../workers/email.worker";

@Module({
  imports: [BullModule.registerQueue({ name: EMAIL_QUEUE })],
  providers: [PaymentsService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
