import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16),
  EMAIL_SERVICE_USER_EMAIL: z.string().email(),
  EMAIL_SERVICE_USER_PASSWORD: z.string().min(6),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(10),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables.");
}

export const env = parsed.data;
