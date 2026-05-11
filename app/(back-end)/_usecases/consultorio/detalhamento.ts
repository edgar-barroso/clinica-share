import { Prisma, type ModalidadeContrato } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

interface Filter {
  consultorioId: string;
  dataInicio: string;
  dataFim: string;
}

export interface DetalheAtendimento {
  id: string;
  data: string;
  hora: string;
  profissionalId: string;
  profissionalNome: string;
  modalidade: ModalidadeContrato;
  valorConsulta: string;
}

export interface DetalheProfissionalLinha {
  profissionalId: string;
  nome: string;
  modalidade: ModalidadeContrato;
  qtdAtendimentos: number;
  valorGerado: string;
}

export interface DetalhePorModalidade {
  aluguelFixo: { qtdAtendimentos: number; valor: string };
  percentual: { qtdAtendimentos: number; valor: string };
}

export interface DetalheConsultorioResponse {
  consultorio: { id: string; nome: string; tipo: string };
  atendimentos: DetalheAtendimento[];
  porProfissional: DetalheProfissionalLinha[];
  porModalidade: DetalhePorModalidade;
  totais: { qtdAtendimentos: number; valor: string };
}

/**
 * UC002 passos 6-7: detalhamento de um consultório no período.
 * Lista atendimentos, agrupa por profissional e por modalidade de contrato.
 */
export async function detalheConsultorio(
  filter: Filter,
): Promise<DetalheConsultorioResponse> {
  const consultorio = await prisma.consultorio.findUnique({
    where: { id: filter.consultorioId },
    select: { id: true, nome: true, tipo: true },
  });
  if (!consultorio) throw new NaoEncontrado("Consultório não encontrado");

  const inicio = new Date(filter.dataInicio);
  const fim = new Date(filter.dataFim);

  const atendimentos = await prisma.atendimento.findMany({
    where: {
      consultorioId: filter.consultorioId,
      status: "realizado",
      statusPagamento: "pago",
      data: { gte: inicio, lte: fim },
    },
    include: {
      profissional: {
        select: { id: true, nome: true, modalidadeContrato: true },
      },
    },
    orderBy: [{ data: "asc" }, { hora: "asc" }],
  });

  const lista: DetalheAtendimento[] = atendimentos.map((a) => ({
    id: a.id,
    data: a.data.toISOString().slice(0, 10),
    hora: a.hora,
    profissionalId: a.profissional.id,
    profissionalNome: a.profissional.nome,
    modalidade: a.profissional.modalidadeContrato,
    valorConsulta: a.valorConsulta.toFixed(2),
  }));

  interface AccProf {
    profissionalId: string;
    nome: string;
    modalidade: ModalidadeContrato;
    qtdAtendimentos: number;
    valor: Prisma.Decimal;
  }
  const porProf = new Map<string, AccProf>();
  let aluguelQtd = 0;
  let aluguelValor = new Prisma.Decimal(0);
  let percentualQtd = 0;
  let percentualValor = new Prisma.Decimal(0);

  for (const a of atendimentos) {
    const item = porProf.get(a.profissional.id) ?? {
      profissionalId: a.profissional.id,
      nome: a.profissional.nome,
      modalidade: a.profissional.modalidadeContrato,
      qtdAtendimentos: 0,
      valor: new Prisma.Decimal(0),
    };
    item.qtdAtendimentos += 1;
    item.valor = item.valor.plus(a.valorConsulta);
    porProf.set(a.profissional.id, item);

    if (a.profissional.modalidadeContrato === "aluguel_fixo") {
      aluguelQtd += 1;
      aluguelValor = aluguelValor.plus(a.valorConsulta);
    } else {
      percentualQtd += 1;
      percentualValor = percentualValor.plus(a.valorConsulta);
    }
  }

  const porProfissional: DetalheProfissionalLinha[] = Array.from(
    porProf.values(),
  )
    .map((p) => ({
      profissionalId: p.profissionalId,
      nome: p.nome,
      modalidade: p.modalidade,
      qtdAtendimentos: p.qtdAtendimentos,
      valorGerado: p.valor.toFixed(2),
    }))
    .sort((a, b) => Number(b.valorGerado) - Number(a.valorGerado));

  const totalValor = aluguelValor.plus(percentualValor);

  return {
    consultorio,
    atendimentos: lista,
    porProfissional,
    porModalidade: {
      aluguelFixo: { qtdAtendimentos: aluguelQtd, valor: aluguelValor.toFixed(2) },
      percentual: {
        qtdAtendimentos: percentualQtd,
        valor: percentualValor.toFixed(2),
      },
    },
    totais: {
      qtdAtendimentos: atendimentos.length,
      valor: totalValor.toFixed(2),
    },
  };
}
