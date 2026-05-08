import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

/**
 * Soft delete: marca `ativo: false`. Não deleta historico (atendimentos
 * e turnos vinculados continuam existindo).
 */
export async function deactivateConsultorio(id: string) {
  const exists = await prisma.consultorio.findUnique({ where: { id } });
  if (!exists) throw new NaoEncontrado("Consultório");

  return prisma.consultorio.update({
    where: { id },
    data: { ativo: false },
  });
}
