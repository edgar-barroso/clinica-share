import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

interface Filter {
  dataInicio: string;
  dataFim: string;
}

/**
 * RE04: lista atendimentos gratuitos E com desconto parcial, com motivo,
 * profissional e paciente. Útil pra auditoria/controle de cortesias.
 *
 * Antes filtrava só `statusPagamento: "gratuito"`, então desconto parcial
 * nunca aparecia apesar do título do relatório — e a coluna "valor original"
 * mostrava o valor cobrado, não o de tabela. Com `valorOriginal` (FI06) o
 * desconto passou a ser detectável: é toda linha cobrada abaixo da tabela.
 */
export async function relatorioGratuitas(filter: Filter) {
  const inicio = new Date(filter.dataInicio);
  const fim = new Date(filter.dataFim);

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      data: { gte: inicio, lte: fim },
      OR: [
        { statusPagamento: "gratuito" },
        // Desconto parcial: cobrado abaixo do preço de tabela.
        { valorOriginal: { not: null } },
      ],
    },
    orderBy: { data: "desc" },
    include: {
      profissional: { select: { id: true, nome: true, especialidade: true } },
      paciente: { select: { id: true, nome: true } },
    },
  });

  const linhas = atendimentos
    .map((a) => {
      const gratuito = a.statusPagamento === "gratuito";
      // `valorOriginal` null = nunca houve desconto registrado; nesse caso o
      // valor de tabela conhecido é o próprio valor cobrado.
      const tabela = a.valorOriginal ?? a.valorConsulta;
      const desconto = tabela.minus(a.valorConsulta);
      return {
        id: a.id,
        data: a.data.toISOString().slice(0, 10),
        hora: a.hora,
        profissional: a.profissional.nome,
        especialidade: a.profissional.especialidade,
        paciente: a.paciente.nome,
        motivo: a.motivoDescontoOuGratuidade ?? "—",
        tipo: gratuito ? ("gratuidade" as const) : ("desconto" as const),
        /** Preço de tabela — o que seria cobrado sem cortesia/desconto. */
        valorOriginal: tabela.toFixed(2),
        /** Quanto foi efetivamente cobrado. */
        valorCobrado: a.valorConsulta.toFixed(2),
        /** Diferença concedida. */
        valorDesconto: desconto.toFixed(2),
        gratuito,
      };
    })
    // Uma linha com valorOriginal preenchido mas igual ao cobrado não é
    // desconto — pode acontecer se o preço for editado depois.
    .filter((l) => l.gratuito || Number(l.valorDesconto) > 0);

  const totalConcedido = linhas.reduce(
    (acc, l) => acc.plus(new Prisma.Decimal(l.valorDesconto)),
    new Prisma.Decimal(0),
  );

  return {
    linhas,
    totalAtendimentos: linhas.length,
    totalGratuidades: linhas.filter((l) => l.gratuito).length,
    totalDescontos: linhas.filter((l) => !l.gratuito).length,
    /** Soma do que a clínica deixou de faturar no período. */
    valorTotalConcedido: totalConcedido.toFixed(2),
  };
}
