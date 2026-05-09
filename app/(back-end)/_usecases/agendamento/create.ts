import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  ConflitoRecurso,
  NaoEncontrado,
  RegraNegocio,
} from "@/app/(back-end)/_lib/errors";
import { horaToTurno } from "@/app/(back-end)/_lib/turnos";
import { getTurnos } from "@/app/(back-end)/_usecases/configuracao/turnos";
import type { CreateAgendamentoInput } from "@/app/(back-end)/api/agendamentos/_schemas";

const NOME_DOW = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const NOME_TURNO: Record<"manha" | "tarde" | "noite", string> = {
  manha: "manhã",
  tarde: "tarde",
  noite: "noite",
};

/**
 * Cria um agendamento (Atendimento status=agendado) com validação:
 * - paciente, profissional e consultório existem e estão ativos
 * - profissional tem turno fixo cobrindo (dia da semana, turno)
 * - consultório bate com o turno fixo do profissional pra esse slot
 * - sem conflito de horário no mesmo consultório (AG05) — constraint
 *   `@@unique([data, hora, consultorioId])` no schema → P2002 → 409
 *
 * `valorConsulta` é seedado a partir de `profissional.valorConsultaBase`
 * — o paciente vê o valor que vai pagar desde o agendamento. A equipe
 * pode ajustar (descontos, gratuidade) na finalização.
 */
export async function createAgendamento(input: CreateAgendamentoInput) {
  const [paciente, profissional, consultorio, turnosConfig] = await Promise.all([
    prisma.paciente.findUnique({ where: { id: input.pacienteId } }),
    prisma.profissional.findUnique({
      where: { id: input.profissionalId },
      include: { turnosFixos: true },
    }),
    prisma.consultorio.findUnique({ where: { id: input.consultorioId } }),
    getTurnos(),
  ]);

  if (!paciente) throw new NaoEncontrado("Paciente");
  if (!profissional) throw new NaoEncontrado("Profissional");
  if (!consultorio) throw new NaoEncontrado("Consultório");

  if (!profissional.ativo) throw new RegraNegocio("Profissional inativo");
  if (!consultorio.ativo) throw new RegraNegocio("Consultório inativo");

  // Valida que o profissional tem turno fixo cobrindo (dow, turno) do
  // agendamento. Usa meio-dia local pra evitar drift de fuso ao parsear
  // a string YYYY-MM-DD.
  const dataObj = new Date(`${input.data}T12:00:00`);
  const dow = dataObj.getDay();
  const turno = horaToTurno(input.hora, turnosConfig);
  const turnoFixo = profissional.turnosFixos.find(
    (tf) => tf.diaSemana === dow && tf.turno === turno,
  );
  if (!turnoFixo) {
    throw new RegraNegocio(
      `${profissional.nome} não atende em ${NOME_DOW[dow]} no turno da ${NOME_TURNO[turno]}`,
    );
  }
  if (turnoFixo.consultorioId !== input.consultorioId) {
    throw new RegraNegocio(
      `Para ${profissional.nome} em ${NOME_DOW[dow]} (${NOME_TURNO[turno]}) o consultório correto é outro — confira o turno fixo do profissional`,
    );
  }

  try {
    return await prisma.atendimento.create({
      data: {
        data: new Date(input.data),
        hora: input.hora,
        pacienteId: input.pacienteId,
        profissionalId: input.profissionalId,
        consultorioId: input.consultorioId,
        valorConsulta: profissional.valorConsultaBase,
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
