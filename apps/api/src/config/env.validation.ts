import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required."),
  SHADOW_DATABASE_URL: z.string().min(1).optional(),
  REDIS_URL: z.string().url("REDIS_URL must be a valid URL."),
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters."),
  JWT_EXPIRES_IN: z.string().default("15m"),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[a-fA-F0-9]{64}$/, "ENCRYPTION_KEY must be 64 hex characters."),
  NEXT_PUBLIC_APP_URL: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL."),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required."),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required."),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required."),
  PAYSTACK_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email("EMAIL_FROM must be a valid email address."),
  SUPPORT_EMAIL: z.string().email("SUPPORT_EMAIL must be a valid email address.").optional(),
  NEXT_PUBLIC_SUPPORT_EMAIL: z
    .string()
    .email("NEXT_PUBLIC_SUPPORT_EMAIL must be a valid email address.")
    .optional(),
  MANUAL_PAYMENT_BANK_NAME: z.string().min(1).optional(),
  MANUAL_PAYMENT_ACCOUNT_NAME: z.string().min(1).optional(),
  MANUAL_PAYMENT_ACCOUNT_NUMBER: z.string().min(1).optional(),
  /** E.164 number without leading + (e.g. 2348146018669) */
  SUPPORT_WHATSAPP: z.string().regex(/^\d{7,15}$/).optional(),
});

export function validateEnv(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return parsed.data;
}
