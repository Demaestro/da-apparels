import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security headers ──────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "https://res.cloudinary.com"],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true },
    })
  );

  // ── Cookie parser (required for HttpOnly refresh token) ───────────────────
  app.use(cookieParser());

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  // ── Global validation pipe (class-validator) ──────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // strip unknown properties
      forbidNonWhitelisted: true,
      transform: true,        // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // ── Global exception filter ───────────────────────────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());

  // ── Global audit interceptor ──────────────────────────────────────────────
  app.useGlobalInterceptors(new AuditInterceptor());

  // ── Raw body for webhook signature verification ───────────────────────────
  app.use("/api/v1/payments/webhook", (req: { rawBody: Buffer }, _res: unknown, next: () => void) => {
    // NestJS needs rawBody enabled in NestFactory.create options for webhook routes
    next();
  });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`DA Apparels API running on http://localhost:${port}/api/v1`);
}

bootstrap();
