import { prisma } from "@/lib/db";

export async function listPacientes(filter: { q?: string }) {
  const where = filter.q
    ? {
        OR: [
          { nome: { contains: filter.q, mode: "insensitive" as const } },
          { email: { contains: filter.q, mode: "insensitive" as const } },
          { cpf: { contains: filter.q } },
          { telefone: { contains: filter.q } },
        ],
      }
    : {};
  return prisma.paciente.findMany({
    where,
    orderBy: { nome: "asc" },
    take: 50,
  });
}
