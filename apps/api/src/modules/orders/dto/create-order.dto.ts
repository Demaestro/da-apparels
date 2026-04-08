import {
  IsArray, IsNotEmpty, IsString, IsInt, IsPositive,
  IsOptional, ValidateNested, IsObject, MaxLength, MinLength,
} from "class-validator";
import { Type } from "class-transformer";

class OrderItemDto {
  @IsString() @IsNotEmpty() @MaxLength(36)
  productId: string;

  @IsOptional() @IsString() @MaxLength(36)
  variantId?: string;

  @IsInt() @IsPositive()
  quantity: number;

  // Fabric customization — optional
  @IsOptional() @IsString() @MaxLength(36)
  fabricOptionId?: string;

  @IsOptional() @IsString() @MaxLength(100)
  fabricColor?: string;

  /** Free-text bespoke instructions — capped to prevent payload abuse */
  @IsOptional() @IsString() @MaxLength(1000)
  fabricNote?: string;
}

class ShippingAddressDto {
  @IsString() @IsNotEmpty() @MaxLength(80)  firstName: string;
  @IsString() @IsNotEmpty() @MaxLength(80)  lastName: string;
  @IsString() @IsNotEmpty() @MaxLength(200) addressLine1: string;
  @IsOptional() @IsString() @MaxLength(200) addressLine2?: string;
  @IsString() @IsNotEmpty() @MaxLength(100) city: string;
  @IsString() @IsNotEmpty() @MaxLength(60)  country: string;
  @IsOptional() @IsString() @MaxLength(20)  postalCode?: string;
  @IsString() @IsNotEmpty() @MaxLength(30)  phone: string;
}

export class CreateOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  /** Optional order-level notes — capped to prevent payload abuse */
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}
