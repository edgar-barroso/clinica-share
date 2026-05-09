import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ConflitoRecurso,
  EmailJaCadastrado,
} from "@/app/(back-end)/_lib/errors";
import { sendInviteEmail } from "@/app/(back-end)/_lib/mailer";
import type { CreateProfissionalInput } from "@/app/(back-end)/api/profissionais/_schemas";

const INVITE_TOKEN_TTL_DAYS = 7;

/**
 * Cria um Profissional + User vinculado com `passwordHash=null` e
 * `passwordResetToken` preenchido. Envia e-mail de convite com link
 * `/redefinir-senha?token=...&primeiroAcesso=1` para o profissional
 * definir sua senha e ganhar acesso à plataforma.
 *
 * O User é criado na MESMA transaction que o Profissional para evitar
 * estado inconsistente. O envio de e-mail acontece fora da transação
 * (best-effort) — se falhar, o convite ainda existe no DB.
 */
export async function createProfissional(input: CreateProfissionalInput) {
  const profExists = await prisma.profissional.findUnique({
    where: { email: input.email },
  });
  if (profExists)
    throw new ConflitoRecurso("E-mail já cadastrado para outro profissional");

  const userExists = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (userExists) throw new EmailJaCadastrado();

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  const profissional = await prisma.$transaction(async (tx) => {
    const prof = await tx.profissional.create({
      data: {
        nome: input.nome,
        especialidade: input.especialidade,
        conselho: input.conselho,
        email: input.email,
        telefone: input.telefone,
        modalidadeContrato: input.modalidadeContrato,
        percentualRepasse: input.percentualRepasse ?? null,
        valorAluguelPorTurno: input.valorAluguelPorTurno ?? null,
        valorConsultaBase: input.valorConsultaBase,
        duracaoConsultaMinutos: input.duracaoConsultaMinutos,
      },
    });
    await tx.user.create({
      data: {
        email: input.email,
        passwordHash: null,
        role: "profissional",
        profissionalId: prof.id,
        passwordResetToken: token,
        passwordResetTokenExpiresAt: expiresAt,
      },
    });
    return prof;
  });

  try {
    await sendInviteEmail({
      to: input.email,
      userName: input.nome,
      invitedAs: "profissional",
      token,
    });
  } catch (err) {
    console.error("Falha ao enviar convite ao profissional:", err);
  }

  return profissional;
}
