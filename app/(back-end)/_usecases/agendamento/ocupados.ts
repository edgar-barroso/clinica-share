import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface ListOcupadosFilter {
  profissionalId: string;
  /** "YYYY-MM-DD" — um único dia */
  data?: string;
  /** "YYYY-MM-DD" inclusive */
  dataInicio?: string;
  /** "YYYY-MM-DD" inclusive */
  dataFim?: string;
}

/**
 * Horários já tomados na agenda de um profissional — só `(data, hora)`, nada
 * de paciente, valor ou consultório.
 *
 * Existe porque disponibilidade e privacidade são coisas diferentes:
 * `GET /api/agendamentos` filtra por RBAC (RF-023), então o paciente recebe
 * apenas as consultas *dele*. A tela de agendamento do portal montava os slots
 * livres a partir dessa lista, ou seja, enxergava a agenda vazia e oferecia
 * horário que outro paciente já tinha reservado — o erro só aparecia no
 * confirmar, como 409 de conflito (AG05).
 *
 * `cancelado` não ocupa: o horário volta a ficar livre.
 */
export async function listOcupados(filter: ListOcupadosFilter) {
  const where: Prisma.AtendimentoWhereInput = {
    profissionalId: filter.profissionalId,
    status: { not: "cancelado" },
  };

  if (filter.data) {
    where.data = new Date(filter.data);
  } else if (filter.dataInicio || filter.dataFim) {
    where.data = {};
    if (filter.dataInicio) where.data.gte = new Date(filter.dataInicio);
    if (filter.dataFim) where.data.lte = new Date(filter.dataFim);
  }

  const linhas = await prisma.atendimento.findMany({
    where,
    select: { data: true, hora: true },
    orderBy: [{ data: "asc" }, { hora: "asc" }],
  });

  return linhas.map((l) => ({
    data: l.data.toISOString().slice(0, 10),
    hora: l.hora,
  }));
}
