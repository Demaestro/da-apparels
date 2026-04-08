import { IsOptional, IsString, IsEnum, IsInt, Min, Max, IsBoolean, IsIn } from "class-validator";
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

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true ? true : value === "false" || value === false ? false : value)
  @IsBoolean()
  hasArTryOn?: boolean;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true ? true : value === "false" || value === false ? false : value)
  @IsBoolean()
  isBespoke?: boolean;

  @IsOptional() @Transform(({ value }) => parseInt(value)) @IsInt() @Min(1)
  page: number = 1;

  @IsOptional() @Transform(({ value }) => parseInt(value)) @IsInt() @Min(1) @Max(100)
  limit: number = 24;

  @IsOptional() @IsString()
  sortBy?: "basePrice" | "createdAt" | "name";

  @IsOptional() @IsIn(["asc", "desc"])
  sortOrder?: "asc" | "desc";
}
