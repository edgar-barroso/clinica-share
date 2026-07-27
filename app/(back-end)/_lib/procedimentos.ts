import { Prisma } from "@prisma/client";

/**
 * AT02: procedimentos extras de um atendimento, cada um com valor próprio.
 * FI04 soma estes valores na base do repasse — por isso tudo que envolve
 * `valor` aqui é `Prisma.Decimal`, nunca float (RNF-101 / DEC-A03).
 */

/** Item validado pelo Zod (`valor` chega como número no JSON do body). */
export interface ProcedimentoInput {
  descricao: string;
  valor: number;
}

type ValorLike = Prisma.Decimal | number | string;

/**
 * Soma dos procedimentos, em Decimal com 2 casas (ROUND_HALF_UP — mesma
 * política de arredondamento do cálculo de repasse).
 */
export function somaProcedimentos(
  procedimentos: { valor: ValorLike }[],
): Prisma.Decimal {
  return procedimentos
    .reduce(
      (acc, p) => acc.plus(new Prisma.Decimal(p.valor)),
      new Prisma.Decimal(0),
    )
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
}

/**
 * Valor gravado em `valorAntes`/`valorDepois` do audit log: soma total
 * formatada com 2 casas (ex: "80.00"). RNF-102 / RF-025.
 */
export function totalProcedimentosAudit(
  procedimentos: { valor: ValorLike }[],
): string {
  return somaProcedimentos(procedimentos).toFixed(2);
}

/**
 * Payload de nested `create` do Prisma — converte o número do body em
 * Decimal e normaliza a descrição.
 */
export function toProcedimentosCreate(
  procedimentos: ProcedimentoInput[],
): { descricao: string; valor: Prisma.Decimal }[] {
  return procedimentos.map((p) => ({
    descricao: p.descricao.trim(),
    valor: new Prisma.Decimal(p.valor),
  }));
}

/**
 * Assinatura estável (independente de ordem) de uma lista de procedimentos.
 * Usada para decidir se a lista de fato mudou antes de gravar audit log.
 */
export function assinaturaProcedimentos(
  procedimentos: { descricao: string; valor: ValorLike }[],
): string {
  return procedimentos
    .map(
      (p) => `${p.descricao.trim()}|${new Prisma.Decimal(p.valor).toFixed(2)}`,
    )
    .sort()
    .join(";");
}

/** `select` padrão devolvido pelas rotas de leitura. */
export const procedimentoSelect = {
  id: true,
  descricao: true,
  valor: true,
} as const;
