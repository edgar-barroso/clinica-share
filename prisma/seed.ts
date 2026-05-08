/**
 * Seed inicial idempotente — cria o usuário admin a partir das envs
 * `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOME` (DEC-P08).
 *
 * Rodar com: `npm run db:seed`
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const env = {
  DATABASE_URL: process.env.DATABASE_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL ?? "admin@clinicashare.local",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? "change-me-on-first-login",
  ADMIN_NOME: process.env.ADMIN_NOME ?? "Administrador",
};

if (!env.DATABASE_URL) {
  console.error("❌ DATABASE_URL não definida no .env");
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: env.ADMIN_EMAIL },
  });

  if (existing) {
    console.log(`✓ Admin já existe: ${env.ADMIN_EMAIL}`);
    return;
  }

  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);
  const admin = await prisma.user.create({
    data: {
      email: env.ADMIN_EMAIL,
      passwordHash,
      role: "admin",
    },
  });

  console.log(`✓ Admin criado: ${admin.email} (id=${admin.id})`);
  console.log(`  Nome: ${env.ADMIN_NOME}`);
  console.log(`  Senha: definida via ADMIN_PASSWORD (.env)`);
}

main()
  .catch((err) => {
    console.error("❌ Erro no seed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
