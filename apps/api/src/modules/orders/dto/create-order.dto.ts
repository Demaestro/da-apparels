import {
  IsArray, IsNotEmpty, IsString, IsInt, IsPositive,
  IsOptional, ValidateNested, IsObject,
} from "class-validator";
import { Type } from "class-transformer";

class OrderItemDto {
  @IsString() @IsNotEmpty()
  productId: string;

  @IsOptional() @IsString()
  variantId?: string;

  @IsInt() @IsPositive()
  quantity: number;

  // Fabric customization — optional
  @IsOptional() @IsString()
  fabricOptionId?: string;

  @IsOptional() @IsString()
  fabricColor?: string;

  @IsOptional() @IsString()
  fabricNote?: string;
}

class ShippingAddressDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  @IsString() @IsNotEmpty() addressLine1: string;
  @IsOptional() @IsString() addressLine2?: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() country: string;
  @IsOptional() @IsString() postalCode?: string;
  @IsString() @IsNotEmpty() phone: string;
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

  @IsOptional() @IsString()
  notes?: string;
}
