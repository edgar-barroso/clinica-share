-- AlterTable: lembrete D-1 (cron envia email/WhatsApp 1 dia antes)
ALTER TABLE "appointments" ADD COLUMN "lembreteEnviadoEm" TIMESTAMP(3);
