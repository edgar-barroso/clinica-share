import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ConflitoRecurso,
  EmailJaCadastrado,
} from "@/app/(back-end)/_lib/errors";
import { hashPassword } from "@/app/(back-end)/_lib/password";
import type { CreatePacienteInput } from "@/app/(back-end)/api/pacientes/_schemas";

/**
 * Gera senha temporária amigável (8 chars alfanuméricos sem caracteres
 * ambíguos como 0/O/1/l). O atendente repassa verbalmente para o paciente,
 * que troca no primeiro acesso (idealmente).
 */
function gerarSenhaTemporaria(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghjkmnpqrstuvwxyz";
  const bytes = randomBytes(8);
  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

/**
 * Cadastro feito pelo atendente: cria Paciente + User vinculado em
 * transação, com senha temporária aleatória. A senha em texto é
 * retornada **uma única vez** para o atendente repassar ao paciente.
 * Paciente troca em "Meu perfil" depois de logar.
 */
export async function createPaciente(input: CreatePacienteInput) {
  const pacienteExiste = await prisma.paciente.findUnique({
    where: { email: input.email },
  });
  if (pacienteExiste)
    throw new ConflitoRecurso("E-mail já cadastrado para outro paciente");

  const userExiste = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (userExiste) throw new EmailJaCadastrado();

  if (input.cpf) {
    const cpfExists = await prisma.paciente.findUnique({
      where: { cpf: input.cpf },
    });
    if (cpfExists) throw new ConflitoRecurso("CPF já cadastrado");
  }

  const senhaTemporaria = gerarSenhaTemporaria();
  const passwordHash = await hashPassword(senhaTemporaria);

  const paciente = await prisma.$transaction(async (tx) => {
    const created = await tx.paciente.create({
      data: {
        nome: input.nome,
        email: input.email,
        telefone: input.telefone,
        cpf: input.cpf ?? null,
        dataNascimento: input.dataNascimento
          ? new Date(input.dataNascimento)
          : null,
        sexo: input.sexo ?? null,
        endereco: input.endereco ?? undefined,
        plano: input.plano ?? undefined,
        senhaDefinida: false,
      },
    });
    await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: "paciente",
        pacienteId: created.id,
      },
    });
    return created;
  });

  return { paciente, senhaTemporaria };
}
