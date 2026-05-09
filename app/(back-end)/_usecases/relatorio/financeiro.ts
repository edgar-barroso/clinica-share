import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface FinanceiroFilter {
  dataInicio: string;
  dataFim: string;
  profissionalId?: string;
  consultorioId?: string;
}

/**
 * RE02: relatório financeiro consolidado por profissional
 * (receita bruta + repasse devido + margem da clínica).
 */
export async function relatorioFinanceiro(filter: FinanceiroFilter) {
  const inicio = new Date(filter.dataInicio);
  const fim = new Date(filter.dataFim);

  const where: Prisma.AtendimentoWhereInput = {
    status: "realizado",
    statusPagamento: "pago",
    data: { gte: inicio, lte: fim },
  };
  if (filter.profissionalId) where.profissionalId = filter.profissionalId;
  if (filter.consultorioId) where.consultorioId = filter.consultorioId;

  const atendimentos = await prisma.atendimento.findMany({
    where,
    include: {
      profissional: {
        select: {
          id: true,
          nome: true,
          especialidade: true,
          modalidadeContrato: true,
          percentualRepasse: true,
        },
      },
    },
  });

  const porProfissional = new Map<
    string,
    {
      profissionalId: string;
      profissionalNome: string;
      modalidade: string;
      qtdAtendimentos: number;
      receitaBruta: Prisma.Decimal;
      repasseEstimado: Prisma.Decimal;
    }
  >();

  for (const a of atendimentos) {
    const acc =
      porProfissional.get(a.profissionalId) ?? {
        profissionalId: a.profissionalId,
        profissionalNome: a.profissional.nome,
        modalidade: a.profissional.modalidadeContrato,
        qtdAtendimentos: 0,
        receitaBruta: new Prisma.Decimal(0),
        repasseEstimado: new Prisma.Decimal(0),
      };
    acc.qtdAtendimentos += 1;
    acc.receitaBruta = acc.receitaBruta.plus(a.valorConsulta);
    if (
      a.profissional.modalidadeContrato === "percentual" &&
      a.profissional.percentualRepasse
    ) {
      acc.repasseEstimado = acc.repasseEstimado.plus(
        new Prisma.Decimal(a.valorConsulta).times(
          a.profissional.percentualRepasse,
        ),
      );
    }
    porProfissional.set(a.profissionalId, acc);
  }

  const linhas = Array.from(porProfissional.values()).map((l) => ({
    profissionalId: l.profissionalId,
    profissionalNome: l.profissionalNome,
    modalidade: l.modalidade,
    qtdAtendimentos: l.qtdAtendimentos,
    receitaBruta: l.receitaBruta.toFixed(2),
    repasseEstimado: l.repasseEstimado.toFixed(2),
    margemClinica: l.receitaBruta.minus(l.repasseEstimado).toFixed(2),
  }));

  const totais = {
    qtdAtendimentos: atendimentos.length,
    receitaBruta: linhas
      .reduce((s, l) => s.plus(l.receitaBruta), new Prisma.Decimal(0))
      .toFixed(2),
    repasseEstimado: linhas
      .reduce((s, l) => s.plus(l.repasseEstimado), new Prisma.Decimal(0))
      .toFixed(2),
    margemClinica: linhas
      .reduce((s, l) => s.plus(l.margemClinica), new Prisma.Decimal(0))
      .toFixed(2),
  };

  return { linhas: linhas.sort((a, b) => a.profissionalNome.localeCompare(b.profissionalNome)), totais };
}
