import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";
import type { UpdateStaffInput } from "@/app/(back-end)/api/staff/_schemas";

export async function updateStaff(id: string, input: UpdateStaffInput) {
  const exists = await prisma.staff.findUnique({ where: { id } });
  if (!exists) throw new NaoEncontrado("Membro da equipe");

  return prisma.staff.update({ where: { id }, data: input });
}
