import { prisma } from "@/lib/db";

export async function cleanAuthData() {
  // Ordem importa por causa das FKs:
  // AuditLog → User; User → Paciente/Profissional/Staff (1:1 opcional)
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { paciente: true, profissional: true, staff: true },
  });
}
