import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { audit } from "@/app/(back-end)/_lib/audit";
import {
  ConflitoRecurso,
  NaoEncontrado,
  RegraNegocio,
} from "@/app/(back-end)/_lib/errors";
import type { CreateWalkInInput } from "@/app/(back-end)/api/atendimentos/_schemas";

type UserSnapshot = Parameters<typeof audit>[0]["user"];

/**
 * AT01: registro de atendimento avulso (walk-in) — paciente atendido
 * sem agendamento prévio. Cria já com `status=realizado`.
 *
 * Audit log gravado para `valorConsulta` e `statusPagamento` (RNF-102).
 */
export async function createWalkInAtendimento(
  input: CreateWalkInInput,
  user: UserSnapshot,
) {
  const [paciente, profissional, consultorio] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: input.pacienteId } }),
    prisma.profissional.findUnique({ where: { id: input.profissionalId } }),
    prisma.consultorio.findUnique({ where: { id: input.consultorioId } }),
  ]);

  if (!paciente) throw new NaoEncontrado("Paciente");
  if (!profissional) throw new NaoEncontrado("Profissional");
  if (!consultorio) throw new NaoEncontrado("Consultório");

  if (!profissional.ativo) throw new RegraNegocio("Profissional inativo");
  if (!consultorio.ativo) throw new RegraNegocio("Consultório inativo");

  try {
    return await prisma.$transaction(async (tx) => {
      const created = await tx.atendimento.create({
        data: {
          data: new Date(input.data),
          hora: input.hora,
          pacienteId: input.pacienteId,
          profissionalId: input.profissionalId,
          consultorioId: input.consultorioId,
          valorConsulta: new Prisma.Decimal(input.valorConsulta),
          status: "realizado",
          statusPagamento: input.statusPagamento,
          motivoDescontoOuGratuidade:
            input.statusPagamento === "gratuito"
              ? input.motivoDescontoOuGratuidade ?? null
              : null,
          usaProntuarioExterno: false,
          prontuarioInterno:
            input.prontuarioInterno === undefined
              ? Prisma.JsonNull
              : (input.prontuarioInterno as Prisma.InputJsonValue),
          observacoes: input.observacoes,
        },
        include: {
          paciente: { select: { id: true, nome: true, telefone: true } },
          profissional: { select: { id: true, nome: true, especialidade: true } },
          consultorio: { select: { id: true, nome: true } },
        },
      });

      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: created.id,
          campo: "valorConsulta",
          valorAntes: "0",
          valorDepois: created.valorConsulta.toString(),
          motivo: "Atendimento avulso (walk-in, AT01)",
        },
        tx,
      );
      await audit(
        {
          user,
          entidade: "Atendimento",
          entidadeId: created.id,
          campo: "statusPagamento",
          valorAntes: "pendente",
          valorDepois: created.statusPagamento,
          motivo:
            input.motivoDescontoOuGratuidade ??
            "Atendimento avulso (walk-in, AT01)",
        },
        tx,
      );

      return created;
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflitoRecurso(
        "Já existe um atendimento neste consultório nesse dia e horário (AG05)",
      );
    }
    throw err;
  }
}
