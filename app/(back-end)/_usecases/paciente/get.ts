import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function getPaciente(id: string) {
  const paciente = await prisma.paciente.findUnique({ where: { id } });
  if (!paciente) throw new NaoEncontrado("Paciente");
  return paciente;
}
