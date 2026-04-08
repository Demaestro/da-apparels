import { IsNumber, IsPositive, IsOptional, IsString, MaxLength, Min, Max } from "class-validator";

export class UpsertMeasurementsDto {
  @IsNumber()
  @IsPositive()
  @Max(200)
  chest: number; // cm

  @IsNumber()
  @IsPositive()
  @Max(200)
  waist: number;

  @IsNumber()
  @IsPositive()
  @Max(200)
  hips: number;

  @IsNumber()
  @IsPositive()
  @Max(120)
  inseam: number;

  @IsNumber()
  @IsPositive()
  @Max(80)
  shoulder: number;

  @IsNumber()
  @IsPositive()
  @Max(100)
  sleeveLength: number;

  @IsNumber()
  @IsPositive()
  @Min(100)
  @Max(250)
  height: number;

  @IsNumber()
  @IsPositive()
  @Min(20)
  @Max(300)
  weight: number; // kg

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
