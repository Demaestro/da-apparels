import { Global, Module } from "@nestjs/common";
import { CacheService } from "./cache.service";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService, CacheService],
  exports: [PrismaService, CacheService],
})
export class PrismaModule {}
