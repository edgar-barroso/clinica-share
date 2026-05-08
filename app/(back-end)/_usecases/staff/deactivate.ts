import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function deactivateStaff(id: string) {
  const exists = await prisma.staff.findUnique({ where: { id } });
  if (!exists) throw new NaoEncontrado("Membro da equipe");

  return prisma.staff.update({ where: { id }, data: { ativo: false } });
}
