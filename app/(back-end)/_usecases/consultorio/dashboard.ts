import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { horaToTurno } from "@/app/(back-end)/_lib/turnos";

interface Filter {
  dataInicio: string;
  dataFim: string;
  modalidade?: "aluguel_fixo" | "percentual" | "todos";
}

export interface DashboardConsultoriosLinha {
  consultorioId: string;
  nome: string;
  tipo: string;
  qtdAtendimentos: number;
  receitaTotal: string;
  receitaMediaPorAtendimento: string;
  taxaOcupacao: number;
}

export interface DashboardConsultoriosKPIs {
  totalAtendimentos: number;
  receitaTotal: string;
  taxaOcupacaoMedia: number;
}

export interface DashboardConsultoriosResponse {
  kpis: DashboardConsultoriosKPIs;
  linhas: DashboardConsultoriosLinha[];
}

/**
 * Dias úteis (seg-sex) no intervalo [inicio, fim] inclusivo.
 * Clínica não opera sáb/dom no MVP (ver TurnoFixo.diaSemana 1..5).
 */
function diasUteisNoPeriodo(inicio: Date, fim: Date): number {
  let dias = 0;
  const cursor = new Date(inicio);
  cursor.setUTCHours(0, 0, 0, 0);
  const limite = new Date(fim);
  limite.setUTCHours(0, 0, 0, 0);
  while (cursor.getTime() <= limite.getTime()) {
    const dow = cursor.getUTCDay(); // 0=Dom..6=Sáb
    if (dow >= 1 && dow <= 5) dias += 1;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dias;
}

/**
 * UC002: dashboard de ocupação e receita por consultório.
 *
 * Métricas:
 * - receita = soma de valorConsulta dos atendimentos realizados+pagos
 * - receitaMedia = receita / qtdAtendimentos
 * - taxaOcupacao = turnos com atendimento / (dias úteis × 3 turnos)
 *
 * Filtro opcional por modalidade de contrato do profissional.
 */
export async function dashboardConsultorios(
  filter: Filter,
): Promise<DashboardConsultoriosResponse> {
  const inicio = new Date(filter.dataInicio);
  const fim = new Date(filter.dataFim);

  const modalidadeFiltro =
    filter.modalidade && filter.modalidade !== "todos"
      ? filter.modalidade
      : undefined;

  const consultorios = await prisma.consultorio.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, tipo: true },
    orderBy: { nome: "asc" },
  });

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: "realizado",
      statusPagamento: "pago",
      data: { gte: inicio, lte: fim },
      ...(modalidadeFiltro
        ? { profissional: { modalidadeContrato: modalidadeFiltro } }
        : {}),
    },
    select: {
      consultorioId: true,
      valorConsulta: true,
      data: true,
      hora: true,
    },
  });

  interface Acc {
    qtdAtendimentos: number;
    receita: Prisma.Decimal;
    turnosOcupados: Set<string>;
  }
  const acc = new Map<string, Acc>();
  for (const c of consultorios) {
    acc.set(c.id, {
      qtdAtendimentos: 0,
      receita: new Prisma.Decimal(0),
      turnosOcupados: new Set<string>(),
    });
  }

  for (const a of atendimentos) {
    const item = acc.get(a.consultorioId);
    if (!item) continue;
    item.qtdAtendimentos += 1;
    item.receita = item.receita.plus(a.valorConsulta);
    const diaIso = a.data.toISOString().slice(0, 10);
    const turno = horaToTurno(a.hora);
    item.turnosOcupados.add(`${diaIso}|${turno}`);
  }

  const diasUteis = diasUteisNoPeriodo(inicio, fim);
  const turnosDisponiveisPorConsultorio = diasUteis * 3;

  const linhas: DashboardConsultoriosLinha[] = consultorios
    .map((c) => {
      const item = acc.get(c.id)!;
      const receitaMedia =
        item.qtdAtendimentos > 0
          ? item.receita.div(item.qtdAtendimentos)
          : new Prisma.Decimal(0);
      const taxaOcupacao =
        turnosDisponiveisPorConsultorio > 0
          ? item.turnosOcupados.size / turnosDisponiveisPorConsultorio
          : 0;
      return {
        consultorioId: c.id,
        nome: c.nome,
        tipo: c.tipo,
        qtdAtendimentos: item.qtdAtendimentos,
        receitaTotal: item.receita.toFixed(2),
        receitaMediaPorAtendimento: receitaMedia.toFixed(2),
        taxaOcupacao,
      };
    })
    .sort((a, b) => Number(b.receitaTotal) - Number(a.receitaTotal));

  const totalAtendimentos = linhas.reduce(
    (s, l) => s + l.qtdAtendimentos,
    0,
  );
  const receitaTotal = linhas.reduce(
    (s, l) => s.plus(l.receitaTotal),
    new Prisma.Decimal(0),
  );
  const taxaOcupacaoMedia =
    consultorios.length > 0 && turnosDisponiveisPorConsultorio > 0
      ? linhas.reduce((s, l) => s + l.taxaOcupacao, 0) / consultorios.length
      : 0;

  return {
    kpis: {
      totalAtendimentos,
      receitaTotal: receitaTotal.toFixed(2),
      taxaOcupacaoMedia,
    },
    linhas,
  };
}
