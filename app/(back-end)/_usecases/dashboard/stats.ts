import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateRepasse } from "@/app/(back-end)/_usecases/repasse/calculate";

export interface DashboardStatsInput {
  dataInicio: string;
  dataFim: string;
}

export interface DashboardChartPoint {
  data: string;
  receita: string;
}

export interface DashboardStats {
  /**
   * Receita bruta: soma de `valorConsulta` de TODOS os atendimentos com
   * status `realizado` no período, independentemente do pagamento. Mede
   * o volume total que passou pela clínica (inclui gratuitos e pendentes).
   */
  receitaBruta: string;
  qtdAtendimentosRealizados: number;
  /**
   * Repasse projetado: soma do que cada profissional ativo receberia se
   * o período fechasse hoje. Calculado live via `calculateRepasse` —
   * ignora se o cron de segunda já rodou ou não. Permite ver receita
   * "em curso" sem esperar o fechamento semanal formal.
   */
  repasseProjetado: string;
  /** Margem da clínica = receita bruta − repasse projetado. */
  margemClinica: string;
  profissionaisAtivos: number;
  profissionaisTotal: number;
  atendimentosPendentes: number;
  receitaPorDia: DashboardChartPoint[];
}

/**
 * RE01: KPIs agregados para o dashboard. Rota agrega tudo
 * server-side; cliente só renderiza.
 *
 * Diferente da página `/financeiro/repasses` (que mostra o livro
 * formal de Repasses fechados pelo cron), o dashboard projeta o
 * repasse live para o período do filtro. Isso evita que o admin
 * tenha que esperar a próxima segunda para ver dados da semana atual.
 */
export async function dashboardStats(
  input: DashboardStatsInput,
): Promise<DashboardStats> {
  const inicio = new Date(input.dataInicio);
  const fim = new Date(input.dataFim);

  const [
    profCount,
    profAtivos,
    profsAtivos,
    pendentes,
    receitaDoDia,
    realizadosBrutos,
  ] = await Promise.all([
    prisma.profissional.count(),
    prisma.profissional.count({ where: { ativo: true } }),
    prisma.profissional.findMany({
      where: { ativo: true },
      select: { id: true },
    }),
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

  // Projeta repasse pra cada profissional ativo, somando. Profs sem
  // contrato configurado (ex: percentual sem percentualRepasse) são
  // tolerados — caem no catch e não quebram o dashboard inteiro.
  const projecoes = await Promise.all(
    profsAtivos.map(async (p) => {
      try {
        const r = await calculateRepasse({
          profissionalId: p.id,
          periodoInicio: input.dataInicio,
          periodoFim: input.dataFim,
        });
        return r.valorRepasse;
      } catch {
        return new Prisma.Decimal(0);
      }
    }),
  );
  const repasseProjetado = projecoes.reduce(
    (s, v) => s.plus(v),
    new Prisma.Decimal(0),
  );

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
  const margemClinica = receitaBruta.minus(repasseProjetado);

  return {
    receitaBruta: receitaBruta.toFixed(2),
    qtdAtendimentosRealizados: realizadosBrutos.length,
    repasseProjetado: repasseProjetado.toFixed(2),
    margemClinica: margemClinica.toFixed(2),
    profissionaisAtivos: profAtivos,
    profissionaisTotal: profCount,
    atendimentosPendentes: pendentes,
    receitaPorDia,
  };
}
