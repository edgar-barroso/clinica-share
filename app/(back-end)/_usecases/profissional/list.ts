import { prisma } from "@/lib/db";

export async function listProfissionais(filter: { ativo?: boolean }) {
  return prisma.profissional.findMany({
    where: filter.ativo === undefined ? {} : { ativo: filter.ativo },
    orderBy: { nome: "asc" },
    include: {
      turnosFixos: { include: { consultorio: { select: { id: true, nome: true } } } },
    },
  });
}
