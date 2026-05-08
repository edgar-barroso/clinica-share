import { prisma } from "@/lib/db";
import { NaoEncontrado } from "@/app/(back-end)/_lib/errors";

export async function removeTurnoFixo(profissionalId: string, turnoId: string) {
  const turno = await prisma.turnoFixo.findFirst({
    where: { id: turnoId, profissionalId },
  });
  if (!turno) throw new NaoEncontrado("Turno fixo");

  await prisma.turnoFixo.delete({ where: { id: turnoId } });
}
