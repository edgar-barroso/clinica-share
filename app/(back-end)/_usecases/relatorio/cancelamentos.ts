import { prisma } from "@/lib/db";

interface Filter {
  dataInicio: string;
  dataFim: string;
}

/**
 * RE05: cancelamentos e nao-comparecimentos com motivo, profissional
 * e paciente. Útil pra entender padrões de no-show.
 */
export async function relatorioCancelamentos(filter: Filter) {
  const inicio = new Date(filter.dataInicio);
  const fim = new Date(filter.dataFim);

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: { in: ["cancelado", "nao_compareceu"] },
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
    status: a.status,
    profissional: a.profissional.nome,
    paciente: a.paciente.nome,
    motivo: a.motivoCancelamento ?? "—",
  }));

  const totais = {
    cancelados: linhas.filter((l) => l.status === "cancelado").length,
    naoCompareceu: linhas.filter((l) => l.status === "nao_compareceu").length,
    total: linhas.length,
  };

  return { linhas, totais };
}
