import { IsString, IsNotEmpty, IsUUID, MaxLength } from "class-validator";

export class TriggerNotificationDto {
  @IsUUID("4", { message: "userId must be a valid UUID." })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  body: string;
}
