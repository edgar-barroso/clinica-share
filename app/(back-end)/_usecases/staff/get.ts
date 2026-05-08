import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function getStaff(id: string) {
  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) throw new NaoEncontrado("Membro da equipe");
  return staff;
}
