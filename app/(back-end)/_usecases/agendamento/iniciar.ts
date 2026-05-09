import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import {
  NaoAutorizado,
  NaoEncontrado,
  RegraNegocio,
} from "@/app/(back-end)/_lib/errors";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

interface Viewer {
  role: Role;
  profissionalId: string | null;
}

/**
 * AT05: profissional inicia atendimento (alternativa quando não houve
 * passagem pela atendente). Transição `agendado → em_atendimento`.
 *
 * RBAC: profissional dono OU admin/auxiliar. Atendente usa o caminho
 * `marcar-chegada` (AG08).
 */
export async function iniciarAtendimento(
  id: string,
  viewer: Viewer,
  user: UserSnapshot,
) {
  const before = await prisma.atendimento.findUnique({ where: { id } });
  if (!before) throw new NaoEncontrado("Atendimento");

  if (before.status === "em_atendimento") {
    throw new RegraNegocio("Atendimento já está em andamento");
  }
  if (before.status !== "agendado") {
    throw new RegraNegocio(
      `Não é possível iniciar — atendimento está com status "${before.status}"`,
    );
  }

  if (
    viewer.role === "profissional" &&
    viewer.profissionalId !== before.profissionalId
  ) {
    throw new NaoAutorizado("Apenas o profissional dono pode iniciar este atendimento");
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
        motivo: "Profissional iniciou atendimento (AT05)",
      },
      tx,
    );
    return updated;
  });
}
