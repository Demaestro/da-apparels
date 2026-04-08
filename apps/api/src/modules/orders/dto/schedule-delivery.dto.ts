import { IsDateString, IsEnum } from "class-validator";
import { DeliverySlot } from "@prisma/client";

export class ScheduleDeliveryDto {
  @IsDateString()
  deliveryDate: string; // ISO 8601

  @IsEnum(DeliverySlot)
  slot: DeliverySlot;
}
