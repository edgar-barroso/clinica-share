import type { Prisma, Role, StatusRepasse } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface ListRepassesFilter {
  profissionalId?: string;
  status?: StatusRepasse;
  periodoInicio?: string;
  periodoFim?: string;
}

export interface ListRepassesViewer {
  role: Role;
  profissionalId: string | null;
}

/**
 * Lista repasses respeitando RBAC:
 * - admin/auxiliar: vê todos
 * - profissional: vê só os próprios
 */
export async function listRepasses(
  filter: ListRepassesFilter,
  viewer: ListRepassesViewer,
) {
  const where: Prisma.RepasseWhereInput = {};

  if (filter.profissionalId) where.profissionalId = filter.profissionalId;
  if (filter.status) where.status = filter.status;
  if (filter.periodoInicio || filter.periodoFim) {
    if (filter.periodoInicio) {
      where.periodoInicio = { gte: new Date(filter.periodoInicio) };
    }
    if (filter.periodoFim) {
      where.periodoFim = { lte: new Date(filter.periodoFim) };
    }
  }

  if (viewer.role === "profissional" && viewer.profissionalId) {
    where.profissionalId = viewer.profissionalId;
  }

  return prisma.repasse.findMany({
    where,
    orderBy: [{ periodoInicio: "desc" }],
    include: {
      profissional: {
        select: { id: true, nome: true, especialidade: true, modalidadeContrato: true },
      },
      atendimentos: { select: { atendimentoId: true } },
    },
    take: 200,
  });
}
