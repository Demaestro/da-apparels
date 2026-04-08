import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { ConfigModule, ConfigService } from "@nestjs/config";
import * as redisStore from "cache-manager-ioredis";
import { ProductsService } from "./products.service";
import { ProductsController } from "./products.controller";
import { CloudinaryService } from "./cloudinary.service";

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        store: redisStore,
        url: config.getOrThrow("REDIS_URL"),
        ttl: 300,
      }),
    }),
  ],
  providers: [ProductsService, CloudinaryService],
  controllers: [ProductsController],
  exports: [ProductsService, CloudinaryService],
})
export class ProductsModule {}
