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
 *
 * Invariante 1:N: cada atendimento só pode estar em UM repasse.
 * O `updateMany` filtra `repasseId: null` — atendimentos já vinculados
 * a outro repasse (cenário só possível com períodos sobrepostos, fora
 * da convenção semanal Mon→Sun) são silenciosamente ignorados.
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
      const created = await tx.repasse.create({
        data: {
          profissionalId: input.profissionalId,
          periodoInicio: new Date(input.periodoInicio),
          periodoFim: new Date(input.periodoFim),
          receitaBruta: calc.receitaBruta,
          valorRepasse: calc.valorRepasse,
          status: "aberto",
        },
      });

      if (calc.atendimentosIds.length > 0) {
        await tx.atendimento.updateMany({
          where: {
            id: { in: calc.atendimentosIds },
            repasseId: null,
          },
          data: { repasseId: created.id },
        });
      }

      return tx.repasse.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          atendimentos: true,
          profissional: {
            select: { id: true, nome: true, especialidade: true },
          },
        },
      });
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
