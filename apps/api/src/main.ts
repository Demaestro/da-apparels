import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/http-exception.filter";
import { AuditInterceptor } from "./common/interceptors/audit.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  // Trust the first proxy hop (required for Railway / Render / any reverse proxy)
  // so that rate-limiting and audit logs record the real client IP, not the proxy IP.
  app.getHttpAdapter().getInstance().set("trust proxy", 1);

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
    }),
  );

  app.use(cookieParser());

  app.enableCors({
    origin: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new AuditInterceptor());
  app.setGlobalPrefix("api/v1");

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`DA Apparels API running on http://localhost:${port}/api/v1`);
}

bootstrap();
