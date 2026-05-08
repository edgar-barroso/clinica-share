import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function getProfissional(id: string) {
  const profissional = await prisma.profissional.findUnique({
    where: { id },
    include: {
      turnosFixos: { include: { consultorio: { select: { id: true, nome: true } } } },
    },
  });
  if (!profissional) throw new NaoEncontrado("Profissional");
  return profissional;
}
