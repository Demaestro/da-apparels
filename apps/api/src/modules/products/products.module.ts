import { Module } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { CloudinaryService } from "./cloudinary.service";

@Module({
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController],
  exports: [ProductsService, CloudinaryService],
})
export class ProductsModule {}
