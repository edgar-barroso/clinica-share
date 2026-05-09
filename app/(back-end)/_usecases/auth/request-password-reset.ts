import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { sendResetPasswordEmail } from "@/app/(back-end)/_lib/mailer";

export interface RequestPasswordResetInput {
  email: string;
}

const TOKEN_EXPIRY_MINUTES = 30;

export async function requestPasswordReset(input: RequestPasswordResetInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { paciente: true, profissional: true, staff: true },
  });

  // Não revelamos se o e-mail existe — sempre retornamos sucesso
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: token,
      passwordResetTokenExpiresAt: expiresAt,
    },
  });

  const userName =
    user.paciente?.nome ?? user.profissional?.nome ?? user.staff?.nome ?? user.email;

  await sendResetPasswordEmail({ to: user.email, userName, token });
}
