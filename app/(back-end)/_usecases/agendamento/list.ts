import type { Prisma, Role, StatusAgendamento } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface ListAgendamentosFilter {
  data?: string;
  dataInicio?: string;
  dataFim?: string;
  profissionalId?: string;
  consultorioId?: string;
  status?: StatusAgendamento;
}

export interface ListAgendamentosViewer {
  role: Role;
  profissionalId: string | null;
  pacienteId: string | null;
}

/**
 * Lista agendamentos respeitando RBAC (RF-023):
 * - admin/auxiliar/atendente: vê todos
 * - profissional: vê só os próprios
 * - paciente: vê só os próprios
 */
export async function listAgendamentos(
  filter: ListAgendamentosFilter,
  viewer: ListAgendamentosViewer,
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
  if (filter.consultorioId) where.consultorioId = filter.consultorioId;
  if (filter.status) where.status = filter.status;

  // Gating por role (RF-023)
  if (viewer.role === "profissional" && viewer.profissionalId) {
    where.profissionalId = viewer.profissionalId;
  } else if (viewer.role === "paciente" && viewer.pacienteId) {
    where.pacienteId = viewer.pacienteId;
  }

  return prisma.atendimento.findMany({
    where,
    orderBy: [{ data: "asc" }, { hora: "asc" }],
    include: {
      paciente: { select: { id: true, nome: true, telefone: true } },
      profissional: { select: { id: true, nome: true, especialidade: true } },
      consultorio: { select: { id: true, nome: true } },
    },
    take: 200,
  });
}
