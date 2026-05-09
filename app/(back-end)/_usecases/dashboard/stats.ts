import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface DashboardStatsInput {
  dataInicio: string;
  dataFim: string;
}

export interface DashboardChartPoint {
  data: string;
  receita: string;
}

export interface DashboardStats {
  repassesAbertos: string;
  repassesPagos: string;
  repassesTotal: string;
  qtdRepassesAbertos: number;
  qtdRepassesPagos: number;
  profissionaisAtivos: number;
  profissionaisTotal: number;
  atendimentosPendentes: number;
  /**
   * Receita bruta: soma de `valorConsulta` de TODOS os atendimentos com
   * status `realizado` no período, independentemente do pagamento. Mede
   * o volume total que passou pela clínica (inclui gratuitos e pendentes).
   */
  receitaBruta: string;
  qtdAtendimentosRealizados: number;
  receitaPorDia: DashboardChartPoint[];
}

/**
 * RE01: KPIs agregados para o dashboard. Rota agrega tudo
 * server-side; cliente só renderiza.
 */
export async function dashboardStats(
  input: DashboardStatsInput,
): Promise<DashboardStats> {
  const inicio = new Date(input.dataInicio);
  const fim = new Date(input.dataFim);

  const [
    repasses,
    profCount,
    profAtivos,
    pendentes,
    receitaDoDia,
    realizadosBrutos,
  ] = await Promise.all([
    // Captura repasses cuja janela seg→dom SOBREPÕE o período do filtro.
    // Necessário pra "Mês atual" / "Personalizado" — a query antiga
    // (`gte: inicio, lte: fim`) só pegava semanas 100% dentro, e ignorava
    // semanas que cruzam a borda do mês, deixando o card de Repasses
    // sub-contado em relação à Receita bruta.
    prisma.repasse.findMany({
      where: { periodoInicio: { lte: fim }, periodoFim: { gte: inicio } },
      select: { valorRepasse: true, status: true },
    }),
    prisma.profissional.count(),
    prisma.profissional.count({ where: { ativo: true } }),
    // "Pagamento pendente" é uma fila de cobrança — só conta atendimentos
    // já realizados. Sem o filtro de status, agendamentos futuros (criados
    // com statusPagamento='pendente' por padrão) entrariam aqui também.
    prisma.atendimento.count({
      where: {
        status: "realizado",
        statusPagamento: "pendente",
        data: { gte: inicio, lte: fim },
      },
    }),
    prisma.atendimento.findMany({
      where: {
        status: "realizado",
        statusPagamento: "pago",
        data: { gte: inicio, lte: fim },
      },
      select: { data: true, valorConsulta: true },
    }),
    // Receita bruta: tudo que passou pela clínica no período, independente
    // de já ter sido pago. Inclui pagos, pendentes e gratuitos (R$ 0).
    prisma.atendimento.findMany({
      where: { status: "realizado", data: { gte: inicio, lte: fim } },
      select: { valorConsulta: true },
    }),
  ]);

  const repassesAbertos = repasses
    .filter((r) => r.status === "aberto")
    .reduce((s, r) => s.plus(r.valorRepasse), new Prisma.Decimal(0));
  const repassesPagos = repasses
    .filter((r) => r.status === "pago")
    .reduce((s, r) => s.plus(r.valorRepasse), new Prisma.Decimal(0));
  const repassesTotal = repassesAbertos.plus(repassesPagos);

  // Agrupa receita por data
  const porData = new Map<string, Prisma.Decimal>();
  for (const a of receitaDoDia) {
    const key = a.data.toISOString().slice(0, 10);
    const acc = porData.get(key) ?? new Prisma.Decimal(0);
    porData.set(key, acc.plus(a.valorConsulta));
  }
  const receitaPorDia: DashboardChartPoint[] = Array.from(porData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([data, val]) => ({ data, receita: val.toFixed(2) }));

  const receitaBruta = realizadosBrutos.reduce(
    (s, a) => s.plus(a.valorConsulta),
    new Prisma.Decimal(0),
  );

  return {
    repassesAbertos: repassesAbertos.toFixed(2),
    repassesPagos: repassesPagos.toFixed(2),
    repassesTotal: repassesTotal.toFixed(2),
    qtdRepassesAbertos: repasses.filter((r) => r.status === "aberto").length,
    qtdRepassesPagos: repasses.filter((r) => r.status === "pago").length,
    profissionaisAtivos: profAtivos,
    profissionaisTotal: profCount,
    atendimentosPendentes: pendentes,
    receitaBruta: receitaBruta.toFixed(2),
    qtdAtendimentosRealizados: realizadosBrutos.length,
    receitaPorDia,
  };
}
