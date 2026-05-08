import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

export async function cleanAuthData() {
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
}

export async function getResetToken(email: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { email } });
  return u?.passwordResetToken ?? null;
}

export async function disconnect() {
  await prisma.$disconnect();
}
