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

  // Verifica explicitamente os dois conflitos possíveis pra dar
  // mensagem específica antes do P2002 genérico.
  const [conflitoProfMesmoSlot, salaJaOcupada] = await Promise.all([
    prisma.turnoFixo.findUnique({
      where: {
        profissionalId_diaSemana_turno: {
          profissionalId,
          diaSemana: input.diaSemana,
          turno: input.turno,
        },
      },
      include: { consultorio: { select: { nome: true } } },
    }),
    prisma.turnoFixo.findUnique({
      where: {
        consultorioId_diaSemana_turno: {
          consultorioId: input.consultorioId,
          diaSemana: input.diaSemana,
          turno: input.turno,
        },
      },
      include: { profissional: { select: { nome: true } } },
    }),
  ]);

  if (conflitoProfMesmoSlot) {
    throw new ConflitoRecurso(
      `${prof.nome} já tem turno fixo nesse dia/horário (sala ${conflitoProfMesmoSlot.consultorio.nome})`,
    );
  }
  if (salaJaOcupada) {
    throw new ConflitoRecurso(
      `Sala ${consultorio.nome} já está alocada para ${salaJaOcupada.profissional.nome} nesse dia/horário`,
    );
  }

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
