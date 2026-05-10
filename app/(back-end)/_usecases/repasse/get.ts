import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NaoAutorizado, NaoEncontrado } from "@/app/(back-end)/_lib/errors";
import { calculateRepasse } from "./calculate";

interface Viewer {
  role: Role;
  profissionalId: string | null;
}

/**
 * Detalhe do repasse com breakdown calculado em tempo real (mesmo cálculo
 * que gerou o repasse, para a UI mostrar quais atendimentos entraram).
 *
 * RBAC: profissional só vê os próprios.
 */
export async function getRepasse(id: string, viewer: Viewer) {
  const repasse = await prisma.repasse.findUnique({
    where: { id },
    include: {
      profissional: {
        select: {
          id: true,
          nome: true,
          especialidade: true,
          modalidadeContrato: true,
          percentualRepasse: true,
          valorAluguelPorTurno: true,
        },
      },
      atendimentos: {
        include: {
          paciente: { select: { id: true, nome: true } },
          consultorio: { select: { id: true, nome: true } },
        },
        orderBy: [{ data: "asc" }, { hora: "asc" }],
      },
    },
  });

  if (!repasse) throw new NaoEncontrado("Repasse");

  if (
    viewer.role === "profissional" &&
    repasse.profissionalId !== viewer.profissionalId
  ) {
    throw new NaoAutorizado("Você só pode ver os próprios repasses");
  }

  // Recalcula breakdown (turnos, modalidade) para a UI
  const breakdown = await calculateRepasse({
    profissionalId: repasse.profissionalId,
    periodoInicio: repasse.periodoInicio.toISOString().slice(0, 10),
    periodoFim: repasse.periodoFim.toISOString().slice(0, 10),
  });

  return { repasse, breakdown };
}
