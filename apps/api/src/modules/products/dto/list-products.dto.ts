import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from "class-validator";
import { Transform } from "class-transformer";
import { ProductStatus } from "@prisma/client";

export class ListProductsDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @IsString()
  categorySlug?: string;

  @IsOptional() @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional() @IsString()
  tag?: string;

  @IsOptional() @Transform(({ value }) => parseInt(value)) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Transform(({ value }) => parseInt(value)) @IsInt() @Min(1) @Max(100)
  limit: number = 24;

  @IsOptional() @IsString()
  sortBy?: "basePrice" | "createdAt" | "name";

  @IsOptional() @IsEnum(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}
