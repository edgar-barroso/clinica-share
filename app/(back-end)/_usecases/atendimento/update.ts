import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";
import type { UpdateAtendimentoInput } from "@/app/(back-end)/api/atendimentos/_schemas";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * FI11: edição pós-realizado. PEND-031: somente admin/auxiliar (a checagem
 * de role é feita na rota antes de chamar este usecase).
 *
 * Audit log gravado para CADA campo financeiro alterado (RNF-102 — toda
 * mutação financeira é auditada). `motivo` no input é registrado em todos
 * os logs gerados pela operação.
 */
export async function updateAtendimento(
  id: string,
  input: UpdateAtendimentoInput,
  user: UserSnapshot,
) {
  const before = await prisma.atendimento.findUnique({ where: { id } });
  if (!before) throw new NaoEncontrado("Atendimento");

  if (before.status !== "realizado") {
    throw new RegraNegocio(
      `Edição pós-realizado só permitida em atendimentos com status "realizado" (atual: "${before.status}")`,
    );
  }

  if (
    input.statusPagamento === "gratuito" &&
    !(input.motivoDescontoOuGratuidade && input.motivoDescontoOuGratuidade.length >= 3)
  ) {
    throw new RegraNegocio(
      "Motivo é obrigatório quando atendimento é gratuito (FI06)",
    );
  }

  return prisma.$transaction(async (tx) => {
    const data: Prisma.AtendimentoUpdateInput = {};
    if (input.valorConsulta !== undefined) {
      data.valorConsulta = new Prisma.Decimal(input.valorConsulta);
    }
    if (input.statusPagamento !== undefined) {
      data.statusPagamento = input.statusPagamento;
    }
    if (input.motivoDescontoOuGratuidade !== undefined) {
      data.motivoDescontoOuGratuidade = input.motivoDescontoOuGratuidade;
    }
    if (input.prontuarioInterno !== undefined) {
      data.prontuarioInterno =
        input.prontuarioInterno === null
          ? Prisma.JsonNull
          : (input.prontuarioInterno as Prisma.InputJsonValue);
    }
    if (input.observacoes !== undefined) {
      data.observacoes = input.observacoes;
    }

    const updated = await tx.atendimento.update({ where: { id }, data });

    if (
      input.valorConsulta !== undefined &&
      before.valorConsulta.toString() !== updated.valorConsulta.toString()
    ) {
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: id,
          campo: "valorConsulta",
          valorAntes: before.valorConsulta.toString(),
          valorDepois: updated.valorConsulta.toString(),
          motivo: input.motivo,
        },
        tx,
      );
    }
    if (
      input.statusPagamento !== undefined &&
      before.statusPagamento !== updated.statusPagamento
    ) {
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: id,
          campo: "statusPagamento",
          valorAntes: before.statusPagamento,
          valorDepois: updated.statusPagamento,
          motivo: input.motivo,
        },
        tx,
      );
    }
    if (
      input.motivoDescontoOuGratuidade !== undefined &&
      (before.motivoDescontoOuGratuidade ?? "") !==
        (updated.motivoDescontoOuGratuidade ?? "")
    ) {
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: id,
          campo: "motivoDescontoOuGratuidade",
          valorAntes: before.motivoDescontoOuGratuidade ?? "",
          valorDepois: updated.motivoDescontoOuGratuidade ?? "",
          motivo: input.motivo,
        },
        tx,
      );
    }

    return updated;
  });
}
