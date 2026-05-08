import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ConflitoRecurso,
  NaoEncontrado,
  RegraNegocio,
} from "@/app/(back-end)/_lib/errors";
import type { CreateAgendamentoInput } from "@/app/(back-end)/api/agendamentos/_schemas";

/**
 * Cria um agendamento (Atendimento status=agendado) com validação:
 * - paciente, profissional e consultório existem e estão ativos
 * - sem conflito de horário no mesmo consultório (AG05) — constraint
 *   `@@unique([data, hora, consultorioId])` no schema → P2002 → 409
 *
 * `valorConsulta` inicia em 0 (será definido na finalização — Fase 4).
 */
export async function createAgendamento(input: CreateAgendamentoInput) {
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
    return await prisma.atendimento.create({
      data: {
        data: new Date(input.data),
        hora: input.hora,
        pacienteId: input.pacienteId,
        profissionalId: input.profissionalId,
        consultorioId: input.consultorioId,
        valorConsulta: 0,
        status: "agendado",
        statusPagamento: "pendente",
        usaProntuarioExterno: false,
        observacoes: input.observacoes,
      },
      include: {
        paciente: { select: { id: true, nome: true, telefone: true } },
        profissional: { select: { id: true, nome: true, especialidade: true } },
        consultorio: { select: { id: true, nome: true } },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflitoRecurso(
        "Já existe um agendamento neste consultório nesse dia e horário (AG05)",
      );
    }
    throw err;
  }
}
