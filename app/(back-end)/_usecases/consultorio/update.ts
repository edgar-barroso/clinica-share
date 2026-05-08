import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";
import type { UpdateConsultorioInput } from "@/app/(back-end)/api/consultorios/_schemas";

export async function updateConsultorio(id: string, input: UpdateConsultorioInput) {
  const exists = await prisma.consultorio.findUnique({ where: { id } });
  if (!exists) throw new NaoEncontrado("Consultório");

  return prisma.consultorio.update({
    where: { id },
    data: input,
  });
}
