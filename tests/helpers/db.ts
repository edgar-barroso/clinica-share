import { prisma } from "@/lib/db";

export async function cleanAuthData() {
  // Ordem importa: User referencia Paciente (FK opcional)
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { paciente: true, profissional: true, staff: true },
  });
}
