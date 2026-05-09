import { prisma } from "@/lib/db";
import { verifyPassword } from "@/app/(back-end)/_lib/password";
import { CredenciaisInvalidas } from "@/app/(back-end)/_lib/errors";

export interface LoginInput {
  email: string;
  senha: string;
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { paciente: true, profissional: true, staff: true },
  });

  if (!user || !user.passwordHash || !user.ativo) {
    throw new CredenciaisInvalidas();
  }

  const ok = await verifyPassword(input.senha, user.passwordHash);
  if (!ok) throw new CredenciaisInvalidas();

  await prisma.user.update({
    where: { id: user.id },
    data: { ultimoAcesso: new Date() },
  });

  return user;
}
