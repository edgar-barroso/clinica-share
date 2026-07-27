import { Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import {
  NaoAutorizado,
  NaoEncontrado,
  RegraNegocio,
} from "@/app/(back-end)/_lib/errors";
import {
  assinaturaProcedimentos,
  procedimentoSelect,
  toProcedimentosCreate,
  totalProcedimentosAudit,
} from "@/app/(back-end)/_lib/procedimentos";
import type { FinalizarAtendimentoInput } from "@/app/(back-end)/api/atendimentos/_schemas";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

interface Viewer {
  role: Role;
  profissionalId: string | null;
}

/**
 * AT06: finaliza atendimento `em_atendimento → realizado`. Salva valor,
 * status de pagamento e prontuário interno (Json livre, PEND-017).
 *
 * RBAC: profissional dono OU admin/auxiliar.
 *
 * AT02: `procedimentos` é opcional e SUBSTITUI a lista atual quando enviado.
 * Se vier `undefined`, a lista existente é preservada — um body sem o campo
 * não pode apagar procedimentos já registrados (perda de dado financeiro).
 *
 * Audit log gravado para `status`, `valorConsulta`, `statusPagamento` e
 * `procedimentos` (RNF-102 — toda mutação financeira é auditada).
 */
export async function finalizarAtendimento(
  id: string,
  input: FinalizarAtendimentoInput,
  viewer: Viewer,
  user: UserSnapshot,
) {
  const before = await prisma.atendimento.findUnique({
    where: { id },
    include: {
      procedimentos: { select: procedimentoSelect },
      // FI06: o preço de tabela é o do cadastro do profissional. Ninguém
      // precisa digitá-lo — o servidor já sabe quanto a consulta custa.
      profissional: { select: { valorConsultaBase: true } },
    },
  });
  if (!before) throw new NaoEncontrado("Atendimento");

  if (before.status !== "em_atendimento") {
    throw new RegraNegocio(
      `Não é possível finalizar — atendimento está com status "${before.status}"`,
    );
  }

  if (
    viewer.role === "profissional" &&
    viewer.profissionalId !== before.profissionalId
  ) {
    throw new NaoAutorizado(
      "Apenas o profissional dono pode finalizar este atendimento",
    );
  }

  // AT02: só mexe na lista quando o campo foi enviado explicitamente.
  const substituiProcedimentos = input.procedimentos !== undefined;

  // FI06: cobrar abaixo do valor de tabela é desconto e preserva a
  // justificativa. Antes o motivo era jogado fora sempre que o pagamento não
  // fosse "gratuito", então desconto parcial ficava sem rastro nenhum.
  //
  // A tabela vem do cadastro do profissional (`valorConsultaBase`); o cliente
  // pode sobrescrever via `valorOriginal` para casos combinados fora da
  // tabela, mas não é obrigado a informar nada.
  const valorTabela = Number(
    input.valorOriginal ?? before.profissional.valorConsultaBase,
  );
  const houveDesconto = input.valorConsulta < valorTabela;

  if (houveDesconto) {
    const motivo = input.motivoDescontoOuGratuidade?.trim() ?? "";
    if (motivo.length < 3) {
      throw new RegraNegocio(
        `Cobrança de ${input.valorConsulta} abaixo do valor de tabela (${valorTabela}) exige justificativa (FI06)`,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.atendimento.update({
      where: { id },
      data: {
        status: "realizado",
        valorConsulta: new Prisma.Decimal(input.valorConsulta),
        // FI06: registra o preço de tabela SÓ quando houve desconto — é o que
        // torna a diferença reconstituível depois. Sem desconto fica null.
        valorOriginal: houveDesconto ? new Prisma.Decimal(valorTabela) : null,
        statusPagamento: input.statusPagamento,
        motivoDescontoOuGratuidade:
          input.statusPagamento === "gratuito" || houveDesconto
            ? input.motivoDescontoOuGratuidade ?? null
            : null,
        // Omitir o campo PRESERVA o prontuário existente. Antes gravava
        // `JsonNull` nesse caso, então finalizar sem reenviar o prontuário
        // apagava o que já estava registrado — inclusive a marcação de
        // prontuário externo feita na abertura do atendimento.
        ...(input.prontuarioInterno === undefined
          ? {}
          : {
              prontuarioInterno:
                input.prontuarioInterno as Prisma.InputJsonValue,
            }),
        // AT04: idem — só mexe quando enviado.
        ...(input.usaProntuarioExterno === undefined
          ? {}
          : { usaProntuarioExterno: input.usaProntuarioExterno }),
        ...(input.referenciaProntuarioExterno === undefined
          ? {}
          : { referenciaProntuarioExterno: input.referenciaProntuarioExterno }),
        observacoes: input.observacoes ?? before.observacoes ?? undefined,
        // Substituição total da lista (deleteMany + create) apenas quando
        // `procedimentos` veio no body; omitir o campo preserva os atuais.
        ...(substituiProcedimentos
          ? {
              procedimentos: {
                deleteMany: {},
                create: toProcedimentosCreate(input.procedimentos ?? []),
              },
            }
          : {}),
      },
      include: {
        procedimentos: {
          select: procedimentoSelect,
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await audit(
      {
        user,
        entidade: "Atendimento",
        entidadeId: id,
        campo: "status",
        valorAntes: "em_atendimento",
        valorDepois: "realizado",
        motivo: "Atendimento finalizado (AT06)",
      },
      tx,
    );
    await audit(
      {
        user,
        entidade: "Atendimento",
        entidadeId: id,
        campo: "valorConsulta",
        valorAntes: before.valorConsulta.toString(),
        valorDepois: updated.valorConsulta.toString(),
        motivo: "Atendimento finalizado (AT06)",
      },
      tx,
    );
    await audit(
      {
        user,
        entidade: "Atendimento",
        entidadeId: id,
        campo: "statusPagamento",
        valorAntes: before.statusPagamento,
        valorDepois: updated.statusPagamento,
        motivo:
          input.motivoDescontoOuGratuidade ?? "Atendimento finalizado (AT06)",
      },
      tx,
    );
    // AT02/FI04: a lista entra na base do repasse — qualquer alteração é
    // auditada com a soma total antes/depois (RNF-102 / RF-025).
    if (
      substituiProcedimentos &&
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
          motivo:
            input.motivoDescontoOuGratuidade ??
            "Procedimentos extras registrados na finalização (AT02/AT06)",
        },
        tx,
      );
    }
    // FI06: desconto concedido é decisão financeira — trilha com o valor de
    // tabela, o valor cobrado e a justificativa.
    if (houveDesconto) {
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: id,
          campo: "desconto",
          valorAntes: String(valorTabela),
          valorDepois: updated.valorConsulta.toString(),
          motivo:
            input.motivoDescontoOuGratuidade ?? "Desconto concedido (FI06)",
        },
        tx,
      );
    }
    // AT04: declarar que o atendimento foi documentado fora do sistema muda
    // onde o dado clínico vive — precisa de trilha (RNF-102 / RF-025).
    if (before.usaProntuarioExterno !== updated.usaProntuarioExterno) {
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: id,
          campo: "usaProntuarioExterno",
          valorAntes: String(before.usaProntuarioExterno),
          valorDepois: String(updated.usaProntuarioExterno),
          motivo:
            updated.referenciaProntuarioExterno ??
            "Prontuário externo declarado na finalização (AT04)",
        },
        tx,
      );
    }

    return updated;
  });
}
