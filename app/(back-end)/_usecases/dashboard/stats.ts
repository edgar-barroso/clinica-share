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

  const [repasses, profCount, profAtivos, pendentes, receitaDoDia] =
    await Promise.all([
      prisma.repasse.findMany({
        where: { periodoInicio: { gte: inicio }, periodoFim: { lte: fim } },
        select: { valorRepasse: true, status: true },
      }),
      prisma.profissional.count(),
      prisma.profissional.count({ where: { ativo: true } }),
      prisma.atendimento.count({
        where: {
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

  return {
    repassesAbertos: repassesAbertos.toFixed(2),
    repassesPagos: repassesPagos.toFixed(2),
    repassesTotal: repassesTotal.toFixed(2),
    qtdRepassesAbertos: repasses.filter((r) => r.status === "aberto").length,
    qtdRepassesPagos: repasses.filter((r) => r.status === "pago").length,
    profissionaisAtivos: profAtivos,
    profissionaisTotal: profCount,
    atendimentosPendentes: pendentes,
    receitaPorDia,
  };
}
