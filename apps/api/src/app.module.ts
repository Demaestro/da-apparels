import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bull";
import { validateEnv } from "./config/env.validation";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProductsModule } from "./modules/products/products.module";
import { OrdersModule } from "./modules/orders/orders.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { StyleQuizModule } from "./modules/style-quiz/style-quiz.module";
import { PrismaModule } from "./lib/prisma.module";

@Module({
  imports: [
    // ── Configuration ────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ["../../.env", "../../.env.local"],
      validate: validateEnv,
    }),

    // ── Rate limiting — 100 req/min globally; auth routes override to 10 ──
    ThrottlerModule.forRoot([
      { name: "global", ttl: 60_000, limit: 100 },
    ]),

    // ── BullMQ via Redis ─────────────────────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        redis: config.get<string>("REDIS_URL"),
      }),
    }),

    // ── Feature modules ──────────────────────────────────────────────────
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
    StyleQuizModule,
  ],
})
export class AppModule {}
