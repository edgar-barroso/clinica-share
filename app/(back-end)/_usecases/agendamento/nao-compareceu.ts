import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import { NaoEncontrado, RegraNegocio } from "@/app/(back-end)/_lib/errors";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * Marca agendamento como `nao_compareceu`. Permitido só a partir de
 * `agendado`. Audit log gravado.
 */
export async function marcarNaoCompareceu(
  id: string,
  user: UserSnapshot,
) {
  const before = await prisma.atendimento.findUnique({ where: { id } });
  if (!before) throw new NaoEncontrado("Agendamento");

  if (before.status !== "agendado") {
    throw new RegraNegocio(
      `Não é possível marcar não compareceu — status atual: "${before.status}"`,
    );
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.atendimento.update({
      where: { id },
      data: { status: "nao_compareceu" },
    });
    await audit(
      {
        user,
        entidade: "Atendimento",
        entidadeId: id,
        campo: "status",
        valorAntes: "agendado",
        valorDepois: "nao_compareceu",
        motivo: "Paciente não compareceu",
      },
      tx,
    );
    return updated;
  });
}
