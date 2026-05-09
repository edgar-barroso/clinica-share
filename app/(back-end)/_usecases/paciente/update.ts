import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";
import type { Prisma } from "@prisma/client";
import type { UpdatePacienteInput } from "@/app/(back-end)/api/pacientes/_schemas";

export async function updatePaciente(id: string, input: UpdatePacienteInput) {
  const exists = await prisma.paciente.findUnique({ where: { id } });
  if (!exists) throw new NaoEncontrado("Paciente");

  const data: Prisma.PacienteUpdateInput = {};
  if (input.nome !== undefined) data.nome = input.nome;
  if (input.email !== undefined) data.email = input.email;
  if (input.telefone !== undefined) data.telefone = input.telefone;
  if (input.cpf !== undefined) data.cpf = input.cpf;
  if (input.dataNascimento !== undefined) {
    data.dataNascimento = input.dataNascimento ? new Date(input.dataNascimento) : null;
  }
  if (input.sexo !== undefined) data.sexo = input.sexo;
  if (input.endereco !== undefined) data.endereco = input.endereco ?? undefined;
  if (input.plano !== undefined) data.plano = input.plano ?? undefined;

  return prisma.paciente.update({ where: { id }, data });
}
