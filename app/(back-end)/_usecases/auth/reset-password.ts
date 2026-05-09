import { prisma } from "@/lib/db";
import { hashPassword } from "@/app/(back-end)/_lib/password";
import { TokenExpirado, TokenInvalido } from "@/app/(back-end)/_lib/errors";

export interface ResetPasswordInput {
  email: string;
  token: string;
  novaSenha: string;
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user || !user.passwordResetToken || user.passwordResetToken !== input.token) {
    throw new TokenInvalido();
  }

  if (!user.passwordResetTokenExpiresAt || user.passwordResetTokenExpiresAt < new Date()) {
    throw new TokenExpirado();
  }

  const passwordHash = await hashPassword(input.novaSenha);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      passwordResetToken: null,
      passwordResetTokenExpiresAt: null,
    },
  });
}
