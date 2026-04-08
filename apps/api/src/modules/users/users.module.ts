import { Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { EncryptionService } from "../../lib/encryption.service";

@Module({
  providers: [UsersService, EncryptionService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
