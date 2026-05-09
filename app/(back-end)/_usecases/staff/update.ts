import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";
import type { UpdateStaffInput } from "@/app/(back-end)/api/staff/_schemas";

/**
 * Mantém `Staff.cargo` e `User.role` sincronizados.
 *
 * Sem este sync, trocar o cargo de "atendente" para "auxiliar" alterava
 * só o registro Staff — o User correspondente continuava com role
 * antiga, então o JWT emitido no próximo login mantinha as permissões
 * erradas e o redirect ia para a rota do cargo antigo.
 */
export async function updateStaff(id: string, input: UpdateStaffInput) {
  const exists = await prisma.staff.findUnique({
    where: { id },
    include: { user: { select: { id: true, role: true } } },
  });
  if (!exists) throw new NaoEncontrado("Membro da equipe");

  const cargoMudou = input.cargo && input.cargo !== exists.cargo;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.staff.update({ where: { id }, data: input });

    if (cargoMudou && exists.user) {
      await tx.user.update({
        where: { id: exists.user.id },
        data: { role: input.cargo! },
      });
    }

    return updated;
  });
}
