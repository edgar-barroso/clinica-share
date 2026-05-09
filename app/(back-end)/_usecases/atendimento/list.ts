import type { Prisma, Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { ListAtendimentosFilter } from "@/app/(back-end)/api/atendimentos/_schemas";

export interface ListAtendimentosViewer {
  role: Role;
  profissionalId: string | null;
  pacienteId: string | null;
}

/**
 * Lista atendimentos respeitando RBAC (RF-023):
 * - admin/auxiliar/atendente: vê todos
 * - profissional: vê só os próprios
 * - paciente: vê só os próprios
 *
 * Sem filtro de status, retorna todos. Pages costumam filtrar por
 * `status=realizado` para a visão de "atendimentos realizados".
 */
export async function listAtendimentos(
  filter: ListAtendimentosFilter,
  viewer: ListAtendimentosViewer,
) {
  const where: Prisma.AtendimentoWhereInput = {};

  if (filter.data) {
    where.data = new Date(filter.data);
  } else if (filter.dataInicio || filter.dataFim) {
    where.data = {};
    if (filter.dataInicio) where.data.gte = new Date(filter.dataInicio);
    if (filter.dataFim) where.data.lte = new Date(filter.dataFim);
  }
  if (filter.profissionalId) where.profissionalId = filter.profissionalId;
  if (filter.pacienteId) where.pacienteId = filter.pacienteId;
  if (filter.consultorioId) where.consultorioId = filter.consultorioId;
  if (filter.status) where.status = filter.status;
  if (filter.statusPagamento) where.statusPagamento = filter.statusPagamento;

  if (viewer.role === "profissional" && viewer.profissionalId) {
    where.profissionalId = viewer.profissionalId;
  } else if (viewer.role === "paciente" && viewer.pacienteId) {
    where.pacienteId = viewer.pacienteId;
  }

  return prisma.atendimento.findMany({
    where,
    orderBy: [{ data: "desc" }, { hora: "desc" }],
    include: {
      paciente: { select: { id: true, nome: true, telefone: true } },
      profissional: { select: { id: true, nome: true, especialidade: true } },
      consultorio: { select: { id: true, nome: true } },
    },
    take: 200,
  });
}
