/**
 * Conserta divergências entre Staff.cargo ↔ User.role.
 *
 * Bug histórico: `updateStaff` antes desta correção alterava só Staff.cargo
 * sem propagar para User.role. Quem trocou um membro de "atendente" para
 * "auxiliar" (financeiro) ficou com User.role congelado no cargo antigo,
 * quebrando login/redirect. Este script encontra esses casos e sincroniza.
 *
 * Idempotente: rodar várias vezes não faz mal.
 *
 * Uso: `npm run db:heal-roles`
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const staffs = await prisma.staff.findMany({
    include: { user: { select: { id: true, role: true, email: true } } },
  });

  let consertados = 0;
  for (const s of staffs) {
    if (!s.user) continue;
    if (s.cargo === s.user.role) continue;
    console.log(
      `→ ${s.email}: Staff.cargo=${s.cargo} ≠ User.role=${s.user.role} — sincronizando para "${s.cargo}"`,
    );
    await prisma.user.update({
      where: { id: s.user.id },
      data: { role: s.cargo },
    });
    consertados += 1;
  }

  console.log(
    consertados === 0
      ? "✓ Nenhuma divergência encontrada — banco saudável."
      : `✓ ${consertados} usuário(s) sincronizado(s).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
