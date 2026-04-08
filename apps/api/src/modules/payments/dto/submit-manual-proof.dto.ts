import { IsOptional, IsString, MaxLength } from "class-validator";

export class SubmitManualProofDto {
  @IsString()
  @MaxLength(80)
  orderId!: string;

  @IsString()
  @MaxLength(120)
  transferReference!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  senderName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  notes?: string;
}
