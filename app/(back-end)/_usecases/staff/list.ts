import type { CargoStaff } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function listStaff(filter: { ativo?: boolean; cargo?: CargoStaff }) {
  const where: { ativo?: boolean; cargo?: CargoStaff } = {};
  if (filter.ativo !== undefined) where.ativo = filter.ativo;
  if (filter.cargo !== undefined) where.cargo = filter.cargo;
  return prisma.staff.findMany({ where, orderBy: { nome: "asc" } });
}
