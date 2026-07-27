import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";
import {
  assinaturaProcedimentos,
  procedimentoSelect,
  toProcedimentosCreate,
  totalProcedimentosAudit,
} from "@/app/(back-end)/_lib/procedimentos";
import type { UpdateAtendimentoInput } from "@/app/(back-end)/api/atendimentos/_schemas";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * FI11: edição pós-realizado. PEND-031: somente admin/auxiliar (a checagem
 * de role é feita na rota antes de chamar este usecase).
 *
 * AT02: `procedimentos`, quando enviado, SUBSTITUI a lista inteira
 * (deleteMany + create na mesma transação). Omitir o campo preserva os
 * procedimentos atuais.
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
  const before = await prisma.atendimento.findUnique({
    where: { id },
    include: { procedimentos: { select: procedimentoSelect } },
  });
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
    // FI06: valor de tabela, para o desconto continuar detectável na edição.
    if (input.valorOriginal !== undefined) {
      data.valorOriginal = new Prisma.Decimal(input.valorOriginal);
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
    // AT04: prontuário externo. Desmarcar limpa a referência junto, senão
    // sobraria um texto órfão apontando para um registro que não se declara
    // mais como externo.
    if (input.usaProntuarioExterno !== undefined) {
      data.usaProntuarioExterno = input.usaProntuarioExterno;
      if (input.usaProntuarioExterno === false) {
        data.referenciaProntuarioExterno = null;
      }
    }
    if (
      input.referenciaProntuarioExterno !== undefined &&
      input.usaProntuarioExterno !== false
    ) {
      data.referenciaProntuarioExterno = input.referenciaProntuarioExterno;
    }
    // AT02: substituição total da lista dentro da mesma transação.
    if (input.procedimentos !== undefined) {
      data.procedimentos = {
        deleteMany: {},
        create: toProcedimentosCreate(input.procedimentos),
      };
    }

    const updated = await tx.atendimento.update({
      where: { id },
      data,
      include: {
        procedimentos: {
          select: procedimentoSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

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
    // AT02/FI04: procedimento altera a base do repasse — alteração na lista
    // é auditada com a soma total antes/depois (RNF-102 / RF-025).
    if (
      input.procedimentos !== undefined &&
      assinaturaProcedimentos(before.procedimentos) !==
        assinaturaProcedimentos(updated.procedimentos)
    ) {
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: id,
          campo: "procedimentos",
          valorAntes: totalProcedimentosAudit(before.procedimentos),
          valorDepois: totalProcedimentosAudit(updated.procedimentos),
          motivo: input.motivo,
        },
        tx,
      );
    }
    // AT04: muda onde o dado clínico do atendimento está guardado.
    if (before.usaProntuarioExterno !== updated.usaProntuarioExterno) {
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: id,
          campo: "usaProntuarioExterno",
          valorAntes: String(before.usaProntuarioExterno),
          valorDepois: String(updated.usaProntuarioExterno),
          motivo: input.motivo,
        },
        tx,
      );
    }

    return updated;
  });
}
