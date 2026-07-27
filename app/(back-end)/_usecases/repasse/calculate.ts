import { Prisma, type ModalidadeContrato } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";
import { horaToTurno, type Turno } from "@/app/(back-end)/_lib/turnos";
import { getTurnos } from "@/app/(back-end)/_usecases/configuracao/turnos";

export interface CalculateRepasseInput {
  profissionalId: string;
  /** "YYYY-MM-DD" inclusive */
  periodoInicio: string;
  /** "YYYY-MM-DD" inclusive */
  periodoFim: string;
}

export interface RepasseAtendimentoBreakdown {
  atendimentoId: string;
  data: string;
  hora: string;
  turno: Turno;
  valorConsulta: Prisma.Decimal;
  /** AT02/FI04: soma dos procedimentos extras deste atendimento */
  valorProcedimentos: Prisma.Decimal;
  /** valorConsulta + valorProcedimentos — o que de fato entra na base */
  valorTotal: Prisma.Decimal;
  procedimentos: { descricao: string; valor: Prisma.Decimal }[];
  statusPagamento: "pago" | "pendente" | "gratuito";
}

/** FI04: soma dos procedimentos extras de um atendimento, em Decimal. */
function somaProcedimentos(
  procedimentos: { valor: Prisma.Decimal }[],
): Prisma.Decimal {
  return procedimentos.reduce(
    (acc, p) => acc.plus(p.valor),
    new Prisma.Decimal(0),
  );
}

export interface CalculateRepasseOutput {
  modalidade: ModalidadeContrato;
  receitaBruta: Prisma.Decimal;
  valorRepasse: Prisma.Decimal;
  atendimentosIds: string[];
  /** Para aluguel_fixo, lista de (data, turno) cobrados */
  turnosUtilizados: { data: string; turno: Turno }[];
  detalhes: RepasseAtendimentoBreakdown[];
}

/**
 * RNF-103 / DEC-A04: cálculo SEMPRE no servidor, em `Decimal`.
 *
 * Regras (PEND-002 = bruto):
 * - **percentual**: soma `valorConsulta` dos atendimentos `realizado` AND
 *   `pago` no período × `percentualRepasse`. Atendimentos `gratuito`,
 *   `pendente`, `cancelado`, `nao_compareceu` não entram na base.
 * - **aluguel_fixo**: conta turnos únicos `(data, turno)` em que houve
 *   ≥1 atendimento `realizado` (independente do `statusPagamento` —
 *   o profissional usou a sala, paga aluguel). Multiplica por
 *   `valorAluguelPorTurno`.
 * - Arredondamento: 2 casas decimais, half-up (ROUND_HALF_UP).
 */
export async function calculateRepasse(
  input: CalculateRepasseInput,
): Promise<CalculateRepasseOutput> {
  const profissional = await prisma.profissional.findUnique({
    where: { id: input.profissionalId },
  });
  if (!profissional) throw new NaoEncontrado("Profissional");

  const inicio = new Date(input.periodoInicio);
  const fim = new Date(input.periodoFim);
  // Carrega a configuração de turnos persistida — admin pode ter
  // ajustado os blocos manhã/tarde/noite em /configuracoes/turnos.
  const turnosConfig = await getTurnos();

  if (profissional.modalidadeContrato === "percentual") {
    if (profissional.percentualRepasse === null) {
      throw new RegraNegocio(
        "Profissional com modalidade percentual não tem percentualRepasse configurado",
      );
    }

    const elegiveis = await prisma.atendimento.findMany({
      where: {
        profissionalId: input.profissionalId,
        status: "realizado",
        statusPagamento: "pago",
        data: { gte: inicio, lte: fim },
      },
      include: { procedimentos: true },
      orderBy: [{ data: "asc" }, { hora: "asc" }],
    });

    // FI04: a base é consulta + procedimentos extras, não só a consulta.
    const receitaBruta = elegiveis.reduce(
      (acc, a) => acc.plus(a.valorConsulta).plus(somaProcedimentos(a.procedimentos)),
      new Prisma.Decimal(0),
    );

    // Half-up rounding: ROUND_HALF_UP = 0
    const valorRepasse = receitaBruta
      .times(profissional.percentualRepasse)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const turnosSet = new Set<string>();
    const turnosUtilizados: { data: string; turno: Turno }[] = [];
    const detalhes: RepasseAtendimentoBreakdown[] = elegiveis.map((a) => {
      const turno = horaToTurno(a.hora, turnosConfig);
      const dataIso = a.data.toISOString().slice(0, 10);
      const key = `${dataIso}|${turno}`;
      if (!turnosSet.has(key)) {
        turnosSet.add(key);
        turnosUtilizados.push({ data: dataIso, turno });
      }
      const valorProcedimentos = somaProcedimentos(a.procedimentos);
      return {
        atendimentoId: a.id,
        data: dataIso,
        hora: a.hora,
        turno,
        valorConsulta: a.valorConsulta,
        valorProcedimentos,
        valorTotal: a.valorConsulta.plus(valorProcedimentos),
        procedimentos: a.procedimentos.map((p) => ({
          descricao: p.descricao,
          valor: p.valor,
        })),
        statusPagamento: a.statusPagamento,
      };
    });

    return {
      modalidade: "percentual",
      receitaBruta: receitaBruta.toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP,
      ),
      valorRepasse,
      atendimentosIds: elegiveis.map((a) => a.id),
      turnosUtilizados,
      detalhes,
    };
  }

  // aluguel_fixo
  if (profissional.valorAluguelPorTurno === null) {
    throw new RegraNegocio(
      "Profissional com modalidade aluguel_fixo não tem valorAluguelPorTurno configurado",
    );
  }

  const realizados = await prisma.atendimento.findMany({
    where: {
      profissionalId: input.profissionalId,
      status: "realizado",
      data: { gte: inicio, lte: fim },
    },
    include: { procedimentos: true },
    orderBy: [{ data: "asc" }, { hora: "asc" }],
  });

  const turnosSet = new Set<string>();
  const turnosUtilizados: { data: string; turno: Turno }[] = [];
  const detalhes: RepasseAtendimentoBreakdown[] = realizados.map((a) => {
    // `turnosConfig` era omitido aqui, então a contagem de turnos cobrados
    // usava os defaults hardcoded 13:00/18:00 e ignorava /configuracoes/turnos
    // — divergência que altera o valor do aluguel.
    const turno = horaToTurno(a.hora, turnosConfig);
    const dataIso = a.data.toISOString().slice(0, 10);
    const key = `${dataIso}|${turno}`;
    if (!turnosSet.has(key)) {
      turnosSet.add(key);
      turnosUtilizados.push({ data: dataIso, turno });
    }
    const valorProcedimentos = somaProcedimentos(a.procedimentos);
    return {
      atendimentoId: a.id,
      data: dataIso,
      hora: a.hora,
      turno,
      valorConsulta: a.valorConsulta,
      valorProcedimentos,
      valorTotal: a.valorConsulta.plus(valorProcedimentos),
      procedimentos: a.procedimentos.map((p) => ({
        descricao: p.descricao,
        valor: p.valor,
      })),
      statusPagamento: a.statusPagamento,
    };
  });

  // Informativa no aluguel fixo (o repasse é turnos × valor), mas precisa
  // refletir consulta + procedimentos para a prestação de contas (FI04).
  const receitaBruta = realizados
    .filter((a) => a.statusPagamento === "pago")
    .reduce(
      (acc, a) => acc.plus(a.valorConsulta).plus(somaProcedimentos(a.procedimentos)),
      new Prisma.Decimal(0),
    )
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const valorRepasse = profissional.valorAluguelPorTurno
    .times(turnosUtilizados.length)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  return {
    modalidade: "aluguel_fixo",
    receitaBruta,
    valorRepasse,
    atendimentosIds: realizados.map((a) => a.id),
    turnosUtilizados,
    detalhes,
  };
}
