import { prisma } from "@/lib/db";
import { ConflitoRecurso } from "@/app/(back-end)/_lib/errors";
import type { CreateStaffInput } from "@/app/(back-end)/api/staff/_schemas";

export async function createStaff(input: CreateStaffInput) {
  const exists = await prisma.staff.findUnique({ where: { email: input.email } });
  if (exists) throw new ConflitoRecurso("E-mail já cadastrado para outro membro");

  return prisma.staff.create({
    data: { ...input, senhaDefinida: false },
  });
}
