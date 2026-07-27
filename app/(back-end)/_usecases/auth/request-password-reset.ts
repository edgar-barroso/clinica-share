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

  // A falha de envio NÃO derruba a requisição, por dois motivos:
  //
  // 1. Segurança: quando o e-mail não existe a função retorna 200 logo acima.
  //    Se o envio a um e-mail existente pudesse virar 500, a diferença entre
  //    as duas respostas revelaria quais contas existem — exatamente o que o
  //    retorno silencioso tenta evitar.
  // 2. O token já está persistido; o usuário consegue concluir a troca por um
  //    reenvio, e o operador vê a falha no log em vez de o pedido sumir.
  try {
    await sendResetPasswordEmail({ to: user.email, userName, token });
  } catch (err) {
    console.error(
      "[auth] falha ao enviar e-mail de recuperação de senha:",
      err instanceof Error ? err.message : err,
    );
  }
}
