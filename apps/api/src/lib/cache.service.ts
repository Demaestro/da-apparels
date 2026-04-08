import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

type MemoryRecord = {
  value: string;
  expiresAt: number;
};

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemoryRecord>();
  private readonly redis?: Redis;
  private redisUnavailable = false;

  constructor(private config: ConfigService) {
    const redisUrl = this.config.get<string>("REDIS_URL");

    if (!redisUrl) {
      this.logger.warn("REDIS_URL is not configured. Product cache will use memory fallback.");
      return;
    }

    this.redis = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: () => undefined,
    });

    this.redis.on("error", (error) => {
      const reason = error.message ? `Redis cache unavailable: ${error.message}` : "Redis cache unavailable.";
      this.markRedisUnavailable(reason);
    });
  }

  async get<T>(key: string) {
    const redis = await this.getRedis();

    if (redis) {
      const value = await redis.get(key);
      return value ? (JSON.parse(value) as T) : undefined;
    }

    const cached = this.memory.get(key);
    if (!cached) {
      return undefined;
    }

    if (cached.expiresAt <= Date.now()) {
      this.memory.delete(key);
      return undefined;
    }

    return JSON.parse(cached.value) as T;
  }

  async set(key: string, value: unknown, ttlSeconds: number) {
    const serialized = JSON.stringify(value);
    const redis = await this.getRedis();

    if (redis) {
      await redis.set(key, serialized, "EX", ttlSeconds);
      return;
    }

    this.memory.set(key, {
      value: serialized,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string) {
    const redis = await this.getRedis();

    if (redis) {
      await redis.del(key);
      return;
    }

    this.memory.delete(key);
  }

  async delByPrefix(prefix: string) {
    const redis = await this.getRedis();

    if (redis) {
      let cursor = "0";
      do {
        const [nextCursor, keys] = await redis.scan(cursor, "MATCH", `${prefix}*`, "COUNT", 100);
        if (keys.length) {
          await redis.del(...keys);
        }
        cursor = nextCursor;
      } while (cursor !== "0");
      return;
    }

    for (const key of this.memory.keys()) {
      if (key.startsWith(prefix)) {
        this.memory.delete(key);
      }
    }
  }

  async getHealth() {
    const redis = await this.getRedis();

    if (!redis) {
      return {
        status: "degraded" as const,
        provider: this.redis ? "redis-fallback" : "memory",
      };
    }

    const result = await redis.ping();
    return {
      status: result === "PONG" ? ("up" as const) : ("down" as const),
      provider: "redis",
    };
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
    }
  }

  private async getRedis() {
    if (!this.redis || this.redisUnavailable) {
      return null;
    }

    if (this.redis.status === "ready") {
      return this.redis;
    }

    try {
      if (this.redis.status === "wait") {
        await this.redis.connect();
      }

      return (this.redis.status as string) === "ready" ? this.redis : null;
    } catch (error) {
      const err = error as Error;
      const reason = err.message ? `Falling back to memory cache: ${err.message}` : "Falling back to memory cache.";
      this.markRedisUnavailable(reason);
      return null;
    }
  }

  private markRedisUnavailable(message: string) {
    if (!this.redisUnavailable) {
      this.logger.warn(message);
    }

    this.redisUnavailable = true;

    if (this.redis && this.redis.status !== "end") {
      this.redis.disconnect();
    }
  }
}
