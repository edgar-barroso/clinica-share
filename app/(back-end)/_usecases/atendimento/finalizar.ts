import { Prisma, type Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import {
  NaoAutorizado,
  NaoEncontrado,
  RegraNegocio,
} from "@/app/(back-end)/_lib/errors";
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
 * Audit log gravado para `status`, `valorConsulta` e `statusPagamento`
 * (RNF-102 — toda mutação financeira é auditada).
 */
export async function finalizarAtendimento(
  id: string,
  input: FinalizarAtendimentoInput,
  viewer: Viewer,
  user: UserSnapshot,
) {
  const before = await prisma.atendimento.findUnique({ where: { id } });
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

  return prisma.$transaction(async (tx) => {
    const updated = await tx.atendimento.update({
      where: { id },
      data: {
        status: "realizado",
        valorConsulta: new Prisma.Decimal(input.valorConsulta),
        statusPagamento: input.statusPagamento,
        motivoDescontoOuGratuidade:
          input.statusPagamento === "gratuito"
            ? input.motivoDescontoOuGratuidade ?? null
            : null,
        prontuarioInterno:
          input.prontuarioInterno === undefined
            ? Prisma.JsonNull
            : (input.prontuarioInterno as Prisma.InputJsonValue),
        observacoes: input.observacoes ?? before.observacoes ?? undefined,
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

    return updated;
  });
}
