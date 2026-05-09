import { prisma } from "@/lib/db";
import { hashPassword } from "@/app/(back-end)/_lib/password";
import { EmailJaCadastrado } from "@/app/(back-end)/_lib/errors";

export interface RegisterPacienteInput {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}

export async function registerPaciente(input: RegisterPacienteInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) throw new EmailJaCadastrado();

  const existingPaciente = await prisma.paciente.findUnique({ where: { email: input.email } });
  if (existingPaciente) throw new EmailJaCadastrado();

  const passwordHash = await hashPassword(input.senha);

  return prisma.$transaction(async (tx) => {
    const paciente = await tx.paciente.create({
      data: {
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        senhaDefinida: true,
      },
    });

    return tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: "paciente",
        pacienteId: paciente.id,
      },
      include: { paciente: true, profissional: true, staff: true },
    });
  });
}
