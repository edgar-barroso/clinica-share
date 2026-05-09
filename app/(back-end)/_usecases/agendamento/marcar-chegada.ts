import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * AG08: atendente marca chegada do paciente. Transição
 * `agendado → em_atendimento` (DEC-A10, PEND-030).
 *
 * Valida: agendamento em `agendado` (não permite chegada após realização
 * ou cancelamento). Audit log gravado.
 */
export async function marcarChegada(id: string, user: UserSnapshot) {
  const before = await prisma.atendimento.findUnique({ where: { id } });
  if (!before) throw new NaoEncontrado("Agendamento");

  if (before.status !== "agendado") {
    throw new RegraNegocio(
      `Não é possível marcar chegada — agendamento está com status \"${before.status}\"`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.atendimento.update({
      where: { id },
      data: { status: "em_atendimento" },
    });

    await audit(
      {
        user,
        entidade: "Atendimento",
        entidadeId: id,
        campo: "status",
        valorAntes: "agendado",
        valorDepois: "em_atendimento",
        motivo: "Chegada do paciente registrada (AG08)",
      },
      tx,
    );

    return updated;
  });
}
