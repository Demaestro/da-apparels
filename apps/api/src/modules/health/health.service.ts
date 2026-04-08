import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CacheService } from "../../lib/cache.service";
import { PrismaService } from "../../lib/prisma.service";

@Injectable()
export class HealthService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private config: ConfigService,
  ) {}

  getLiveness() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  async getReadiness() {
    const [database, cache] = await Promise.all([
      this.getDatabaseHealth(),
      this.cache.getHealth(),
    ]);

    const integrations = {
      cloudinaryConfigured:
        this.hasRealConfigValue("CLOUDINARY_CLOUD_NAME", ["demo"]) &&
        this.hasRealConfigValue("CLOUDINARY_API_KEY") &&
        this.hasRealConfigValue("CLOUDINARY_API_SECRET"),
      resendConfigured:
        this.hasRealConfigValue("RESEND_API_KEY") &&
        this.hasRealConfigValue("EMAIL_FROM"),
      paystackConfigured: this.hasRealConfigValue("PAYSTACK_SECRET_KEY"),
    };

    const ready = database.status === "up" && cache.status !== "down";

    return {
      status: ready ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
      services: { database, cache },
      integrations,
    };
  }

  async assertReady() {
    const readiness = await this.getReadiness();

    if (readiness.status !== "ok") {
      throw new ServiceUnavailableException(readiness);
    }

    return readiness;
  }

  private async getDatabaseHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: "up" as const, provider: "postgres" };
    } catch (error) {
      const err = error as Error;
      return { status: "down" as const, provider: "postgres", message: err.message };
    }
  }

  private hasRealConfigValue(key: string, exactDisallowed: string[] = []) {
    const value = this.config.get<string>(key);

    if (!value) {
      return false;
    }

    const normalized = value.trim().toLowerCase();

    if (!normalized) {
      return false;
    }

    if (exactDisallowed.some((candidate) => candidate.toLowerCase() === normalized)) {
      return false;
    }

    return !["replace-with", "placeholder", "your-", "example", "local-placeholder"].some(
      (token) => normalized.includes(token),
    );
  }
}
