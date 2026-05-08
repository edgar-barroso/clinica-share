import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function getAgendamento(id: string) {
  const a = await prisma.atendimento.findUnique({
    where: { id },
    include: {
      paciente: true,
      profissional: { select: { id: true, nome: true, especialidade: true, conselho: true } },
      consultorio: { select: { id: true, nome: true } },
    },
  });
  if (!a) throw new NaoEncontrado("Agendamento");
  return a;
}
