import { prisma } from "@/lib/db";

export async function listConsultorios(filter: { ativo?: boolean }) {
  return prisma.consultorio.findMany({
    where: filter.ativo === undefined ? {} : { ativo: filter.ativo },
    orderBy: { nome: "asc" },
  });
}
