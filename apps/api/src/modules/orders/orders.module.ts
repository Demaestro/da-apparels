import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";
import { OrdersService } from "./orders.service";
import { OrdersController } from "./orders.controller";
import { EmailWorker, EMAIL_QUEUE } from "../../workers/email.worker";

@Module({
  imports: [
    BullModule.registerQueue({ name: EMAIL_QUEUE }),
  ],
  providers: [OrdersService, EmailWorker],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
