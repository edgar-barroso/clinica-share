import { prisma } from "@/lib/db";

interface Filter {
  dataInicio: string;
  dataFim: string;
}

/**
 * RE04: lista atendimentos gratuitos com motivo, profissional e
 * paciente. Útil pra auditoria/controle de cortesias.
 */
export async function relatorioGratuitas(filter: Filter) {
  const inicio = new Date(filter.dataInicio);
  const fim = new Date(filter.dataFim);

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      statusPagamento: "gratuito",
      data: { gte: inicio, lte: fim },
    },
    orderBy: { data: "desc" },
    include: {
      profissional: { select: { id: true, nome: true, especialidade: true } },
      paciente: { select: { id: true, nome: true } },
    },
  });

  const linhas = atendimentos.map((a) => ({
    id: a.id,
    data: a.data.toISOString().slice(0, 10),
    hora: a.hora,
    profissional: a.profissional.nome,
    especialidade: a.profissional.especialidade,
    paciente: a.paciente.nome,
    motivo: a.motivoDescontoOuGratuidade ?? "—",
    valorOriginal: a.valorConsulta.toFixed(2),
  }));

  return {
    linhas,
    totalAtendimentos: linhas.length,
  };
}
