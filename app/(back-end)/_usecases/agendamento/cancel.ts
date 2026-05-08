import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";
import type { CancelAgendamentoInput } from "@/app/(back-end)/api/agendamentos/_schemas";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * Cancela um agendamento (AG06). Motivo é obrigatório (validado no schema).
 * Audit log gravado na tabela AuditLog (RNF-102 / RF-025).
 *
 * Só é possível cancelar agendamentos `agendado` ou `em_atendimento` —
 * `realizado`/`cancelado`/`nao_compareceu` retornam 400.
 */
export async function cancelAgendamento(
  id: string,
  input: CancelAgendamentoInput,
  user: UserSnapshot,
) {
  const before = await prisma.atendimento.findUnique({ where: { id } });
  if (!before) throw new NaoEncontrado("Agendamento");

  if (before.status === "cancelado") {
    throw new RegraNegocio("Agendamento já está cancelado");
  }
  if (before.status === "realizado") {
    throw new RegraNegocio("Não é possível cancelar atendimento já realizado");
  }
  if (before.status === "nao_compareceu") {
    throw new RegraNegocio("Agendamento já marcado como não compareceu");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.atendimento.update({
      where: { id },
      data: {
        status: "cancelado",
        motivoCancelamento: input.motivo,
      },
    });

    await audit(
      {
        user,
        entidade: "Atendimento",
        entidadeId: id,
        campo: "status",
        valorAntes: before.status,
        valorDepois: "cancelado",
        motivo: input.motivo,
      },
      tx,
    );

    return updated;
  });
}
