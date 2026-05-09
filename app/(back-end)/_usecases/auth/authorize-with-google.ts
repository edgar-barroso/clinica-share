import { prisma } from "@/lib/db";
import { verifyGoogleIdToken } from "@/app/(back-end)/_lib/google-verify";

export interface AuthorizeWithGoogleInput {
  idToken: string;
}

export async function authorizeWithGoogle(input: AuthorizeWithGoogleInput) {
  const googleUser = await verifyGoogleIdToken(input.idToken);

  // 1) Tenta achar User por googleId
  let user = await prisma.user.findUnique({
    where: { googleId: googleUser.googleId },
    include: { paciente: true, profissional: true, staff: true },
  });

  // 2) Se não, tenta por email — vincula googleId
  if (!user) {
    const byEmail = await prisma.user.findUnique({
      where: { email: googleUser.email },
      include: { paciente: true, profissional: true, staff: true },
    });
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: { googleId: googleUser.googleId, ultimoAcesso: new Date() },
        include: { paciente: true, profissional: true, staff: true },
      });
    }
  }

  // 3) Se não existe usuário ainda, cria como paciente
  if (!user) {
    // Pode existir Paciente legado sem User vinculado — reuso se houver
    let paciente = await prisma.paciente.findUnique({ where: { email: googleUser.email } });
    if (!paciente) {
      paciente = await prisma.paciente.create({
        data: {
          nome: googleUser.name,
          email: googleUser.email,
          telefone: "",
          senhaDefinida: false,
        },
      });
    }

    user = await prisma.user.create({
      data: {
        email: googleUser.email,
        googleId: googleUser.googleId,
        role: "paciente",
        pacienteId: paciente.id,
      },
      include: { paciente: true, profissional: true, staff: true },
    });
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoAcesso: new Date() },
    });
  }

  return user;
}
