import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { ConflitoRecurso } from "@/app/(back-end)/_lib/errors";
import { calculateRepasse } from "./calculate";

interface GerarInput {
  profissionalId: string;
  periodoInicio: string;
  periodoFim: string;
}

/**
 * FI07: gera (ou retorna) o `Repasse` calculado pelo servidor para o
 * profissional/período. Idempotente: se já existe `Repasse` no período
 * com `@@unique(profissionalId, periodoInicio, periodoFim)`, retorna
 * o existente sem recalcular (evita sobrescrever pagamento já marcado).
 */
export async function gerarRepasse(input: GerarInput) {
  const existing = await prisma.repasse.findUnique({
    where: {
      profissionalId_periodoInicio_periodoFim: {
        profissionalId: input.profissionalId,
        periodoInicio: new Date(input.periodoInicio),
        periodoFim: new Date(input.periodoFim),
      },
    },
    include: {
      atendimentos: true,
      profissional: { select: { id: true, nome: true, especialidade: true } },
    },
  });
  if (existing) return existing;

  const calc = await calculateRepasse(input);

  try {
    return await prisma.$transaction(async (tx) => {
      const repasse = await tx.repasse.create({
        data: {
          profissionalId: input.profissionalId,
          periodoInicio: new Date(input.periodoInicio),
          periodoFim: new Date(input.periodoFim),
          receitaBruta: calc.receitaBruta,
          valorRepasse: calc.valorRepasse,
          status: "aberto",
          atendimentos: {
            create: calc.atendimentosIds.map((atendimentoId) => ({
              atendimentoId,
            })),
          },
        },
        include: {
          atendimentos: true,
          profissional: { select: { id: true, nome: true, especialidade: true } },
        },
      });
      return repasse;
    });
  } catch (err) {
    // Race condition: outro request criou nesse meio tempo
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const fallback = await prisma.repasse.findUnique({
        where: {
          profissionalId_periodoInicio_periodoFim: {
            profissionalId: input.profissionalId,
            periodoInicio: new Date(input.periodoInicio),
            periodoFim: new Date(input.periodoFim),
          },
        },
        include: {
          atendimentos: true,
          profissional: {
            select: { id: true, nome: true, especialidade: true },
          },
        },
      });
      if (fallback) return fallback;
      throw new ConflitoRecurso("Conflito ao gerar repasse");
    }
    throw err;
  }
}
