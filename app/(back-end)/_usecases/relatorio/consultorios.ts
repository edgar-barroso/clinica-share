import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

interface Filter {
  dataInicio: string;
  dataFim: string;
}

/**
 * RE03: ranking de consultórios por receita gerada no período.
 */
export async function relatorioConsultorios(filter: Filter) {
  const inicio = new Date(filter.dataInicio);
  const fim = new Date(filter.dataFim);

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      status: "realizado",
      statusPagamento: "pago",
      data: { gte: inicio, lte: fim },
    },
    include: {
      consultorio: { select: { id: true, nome: true, tipo: true } },
    },
  });

  const porConsultorio = new Map<
    string,
    {
      consultorioId: string;
      nome: string;
      tipo: string;
      qtdAtendimentos: number;
      receita: Prisma.Decimal;
    }
  >();

  for (const a of atendimentos) {
    const acc = porConsultorio.get(a.consultorioId) ?? {
      consultorioId: a.consultorioId,
      nome: a.consultorio.nome,
      tipo: a.consultorio.tipo,
      qtdAtendimentos: 0,
      receita: new Prisma.Decimal(0),
    };
    acc.qtdAtendimentos += 1;
    acc.receita = acc.receita.plus(a.valorConsulta);
    porConsultorio.set(a.consultorioId, acc);
  }

  const linhas = Array.from(porConsultorio.values())
    .map((l) => ({
      consultorioId: l.consultorioId,
      nome: l.nome,
      tipo: l.tipo,
      qtdAtendimentos: l.qtdAtendimentos,
      receita: l.receita.toFixed(2),
    }))
    .sort((a, b) => Number(b.receita) - Number(a.receita));

  return { linhas };
}
