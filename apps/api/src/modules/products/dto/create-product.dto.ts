import {
  IsString, IsNotEmpty, IsOptional, IsNumber, IsPositive,
  IsBoolean, IsEnum, MinLength, MaxLength,
} from "class-validator";
import { ProductStatus } from "@prisma/client";

export class CreateProductDto {
  @IsString() @IsNotEmpty() @MinLength(3) @MaxLength(150)
  name: string;

  @IsString() @IsNotEmpty()
  slug: string;

  @IsString() @IsNotEmpty()
  description: string;

  @IsOptional() @IsString() @MaxLength(200)
  tagline?: string;

  @IsNumber() @IsPositive()
  basePrice: number;

  @IsOptional() @IsString() @MaxLength(3)
  currency?: string;

  @IsString()
  categoryId: string;

  @IsOptional() @IsBoolean()
  isBespoke?: boolean;

  @IsOptional() @IsBoolean()
  hasArTryOn?: boolean;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsString() @MaxLength(160)
  metaTitle?: string;

  @IsOptional() @IsString() @MaxLength(320)
  metaDescription?: string;
}
