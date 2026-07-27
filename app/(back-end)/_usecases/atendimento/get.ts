import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { NaoAutorizado, NaoEncontrado } from "@/app/(back-end)/_lib/errors";
import { procedimentoSelect } from "@/app/(back-end)/_lib/procedimentos";

interface Viewer {
  role: Role;
  profissionalId: string | null;
  pacienteId: string | null;
}

/**
 * Busca atendimento por id com RBAC:
 * - paciente: só vê o próprio (`pacienteId === viewer.pacienteId`)
 * - profissional: só vê os atendimentos atribuídos a ele
 * - admin/aux/atendente: livre
 *
 * AT02: retorna também `procedimentos` (id, descricao, valor) do atendimento.
 */
export async function getAtendimento(id: string, viewer: Viewer) {
  const atendimento = await prisma.atendimento.findUnique({
    where: { id },
    include: {
      paciente: { select: { id: true, nome: true, telefone: true, email: true } },
      profissional: {
        select: { id: true, nome: true, especialidade: true, conselho: true },
      },
      consultorio: { select: { id: true, nome: true } },
      procedimentos: {
        select: procedimentoSelect,
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!atendimento) throw new NaoEncontrado("Atendimento");

  if (viewer.role === "paciente" && atendimento.pacienteId !== viewer.pacienteId) {
    throw new NaoAutorizado("Você só pode ver seus próprios atendimentos");
  }
  if (
    viewer.role === "profissional" &&
    atendimento.profissionalId !== viewer.profissionalId
  ) {
    throw new NaoAutorizado(
      "Você só pode ver atendimentos atribuídos a você",
    );
  }

  return atendimento;
}
