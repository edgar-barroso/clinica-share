import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import {
  ConflitoRecurso,
  EmailJaCadastrado,
} from "@/app/(back-end)/_lib/errors";
import { sendInviteEmail } from "@/app/(back-end)/_lib/mailer";
import type { CreateStaffInput } from "@/app/(back-end)/api/staff/_schemas";

const INVITE_TOKEN_TTL_DAYS = 7;

/**
 * Cria Staff + User vinculado com convite por e-mail. O `cargo`
 * (auxiliar | atendente) mapeia direto para o `role` do User.
 *
 * Mesma estratégia de `createProfissional`: tudo em uma transação,
 * e-mail fora dela (best-effort).
 */
export async function createStaff(input: CreateStaffInput) {
  const staffExists = await prisma.staff.findUnique({
    where: { email: input.email },
  });
  if (staffExists)
    throw new ConflitoRecurso("E-mail já cadastrado para outro membro");

  const userExists = await prisma.user.findUnique({
    where: { email: input.email },
  });
  if (userExists) throw new EmailJaCadastrado();

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(
    Date.now() + INVITE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  // cargo do Staff (auxiliar | atendente) → role do User (1:1)
  const role = input.cargo;

  const staff = await prisma.$transaction(async (tx) => {
    const created = await tx.staff.create({
      data: { ...input, senhaDefinida: false },
    });
    await tx.user.create({
      data: {
        email: input.email,
        passwordHash: null,
        role,
        staffId: created.id,
        passwordResetToken: token,
        passwordResetTokenExpiresAt: expiresAt,
      },
    });
    return created;
  });

  try {
    await sendInviteEmail({
      to: input.email,
      userName: input.nome,
      invitedAs: input.cargo,
      token,
    });
  } catch (err) {
    console.error("Falha ao enviar convite ao membro da equipe:", err);
  }

  return staff;
}
