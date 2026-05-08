import { prisma } from "@/lib/db";

/**
 * Limpa todas as tabelas em ordem de FK reversa. Usado em `beforeEach` dos
 * testes de integração para garantir isolamento.
 */
export async function cleanDb() {
  // Ordem de FK (filhos antes de pais):
  // RepasseAtendimento → Repasse + Atendimento
  // Atendimento → Paciente + Profissional + Consultorio
  // TurnoFixo → Profissional + Consultorio
  // Repasse → Profissional
  // AuditLog → User
  // User → Paciente/Profissional/Staff (FK opcional 1:1)
  await prisma.repasseAtendimento.deleteMany();
  await prisma.repasse.deleteMany();
  await prisma.atendimento.deleteMany();
  await prisma.turnoFixo.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.paciente.deleteMany();
  await prisma.profissional.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.consultorio.deleteMany();
}

/** @deprecated use `cleanDb()` */
export const cleanAuthData = cleanDb;

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { paciente: true, profissional: true, staff: true },
  });
}
