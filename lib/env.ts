import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  JWT_SECRET: z.string().min(16),
  EMAIL_SERVICE_USER_EMAIL: z.string().email(),
  EMAIL_SERVICE_USER_PASSWORD: z.string().min(6),
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: z.string().min(10),
  // Seed inicial — usuário admin criado via prisma/seed.ts (DEC-P08)
  ADMIN_EMAIL: z.string().email().default("admin@clinicashare.local"),
  ADMIN_PASSWORD: z.string().min(8).default("change-me-on-first-login"),
  ADMIN_NOME: z.string().min(2).default("Administrador"),
  // Token bearer que protege os endpoints /api/cron/* chamados por
  // agendador externo (Vercel Cron, GitHub Actions, cronjob.org).
  CRON_SECRET: z.string().min(16).default("change-me-cron-secret-min-16-chars"),
  // WhatsApp (lembrete D-1). Sem provider configurado, app loga a
  // mensagem e segue (modo dev). Provider atual: Twilio.
  WHATSAPP_PROVIDER: z.enum(["twilio", "meta", "zapi"]).optional(),
  WHATSAPP_FROM: z.string().optional(),
  // Twilio aceita 2 formas de credencial:
  //   A) TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN (recomendado)
  //   B) WHATSAPP_API_TOKEN no formato "AC...:authtoken" (legacy)
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  WHATSAPP_API_TOKEN: z.string().optional(),
  // URL base — não usada pelo SDK, mantida para compat.
  WHATSAPP_API_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables.");
}

export const env = parsed.data;
