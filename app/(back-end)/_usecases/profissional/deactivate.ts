import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function deactivateProfissional(id: string) {
  const exists = await prisma.profissional.findUnique({ where: { id } });
  if (!exists) throw new NaoEncontrado("Profissional");

  return prisma.profissional.update({
    where: { id },
    data: { ativo: false },
  });
}
