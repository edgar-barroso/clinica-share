import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { ConflitoRecurso, NaoEncontrado } from "@/app/(back-end)/_lib/errors";
import type { CreateTurnoFixoInput } from "@/app/(back-end)/api/profissionais/_schemas";

export async function addTurnoFixo(profissionalId: string, input: CreateTurnoFixoInput) {
  const prof = await prisma.profissional.findUnique({ where: { id: profissionalId } });
  if (!prof) throw new NaoEncontrado("Profissional");

  const consultorio = await prisma.consultorio.findUnique({
    where: { id: input.consultorioId },
  });
  if (!consultorio) throw new NaoEncontrado("Consultório");

  try {
    return await prisma.turnoFixo.create({
      data: {
        profissionalId,
        consultorioId: input.consultorioId,
        diaSemana: input.diaSemana,
        turno: input.turno,
      },
      include: { consultorio: { select: { id: true, nome: true } } },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      // unique violation: profissional já tem turno nesse dia/turno OU
      // consultório já está alocado nesse dia/turno (PEND-015)
      throw new ConflitoRecurso(
        "Conflito de turno: profissional ou consultório já alocado neste dia/turno",
      );
    }
    throw err;
  }
}
