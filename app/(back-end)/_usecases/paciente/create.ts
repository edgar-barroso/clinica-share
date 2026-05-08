import { prisma } from "@/lib/db";
import { ConflitoRecurso } from "@/app/(back-end)/_lib/errors";
import type { CreatePacienteInput } from "@/app/(back-end)/api/pacientes/_schemas";

export async function createPaciente(input: CreatePacienteInput) {
  const exists = await prisma.paciente.findUnique({ where: { email: input.email } });
  if (exists) throw new ConflitoRecurso("E-mail já cadastrado para outro paciente");

  if (input.cpf) {
    const cpfExists = await prisma.paciente.findUnique({ where: { cpf: input.cpf } });
    if (cpfExists) throw new ConflitoRecurso("CPF já cadastrado");
  }

  return prisma.paciente.create({
    data: {
      nome: input.nome,
      email: input.email,
      telefone: input.telefone,
      cpf: input.cpf ?? null,
      dataNascimento: input.dataNascimento ? new Date(input.dataNascimento) : null,
      sexo: input.sexo ?? null,
      endereco: input.endereco ?? undefined,
      plano: input.plano ?? undefined,
      // Criado pelo admin/atendente — paciente ainda não definiu senha
      senhaDefinida: false,
    },
  });
}
