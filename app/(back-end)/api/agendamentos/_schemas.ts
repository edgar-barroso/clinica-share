import { z } from "zod";

export const createAgendamentoSchema = z.object({
  pacienteId: z.string().min(1),
  profissionalId: z.string().min(1),
  consultorioId: z.string().min(1),
  // ISO date YYYY-MM-DD
  data: z.string().date(),
  // HH:mm
  hora: z.string().regex(/^\d{2}:\d{2}$/, "Hora deve estar em formato HH:mm"),
  observacoes: z.string().max(500).optional(),
});

export const cancelAgendamentoSchema = z.object({
  motivo: z.string().min(3, "Motivo é obrigatório").max(200),
});

export const listAgendamentosQuerySchema = z.object({
  data: z.string().date().optional(),
  dataInicio: z.string().date().optional(),
  dataFim: z.string().date().optional(),
  profissionalId: z.string().optional(),
  consultorioId: z.string().optional(),
  status: z
    .enum(["agendado", "em_atendimento", "realizado", "cancelado", "nao_compareceu"])
    .optional(),
});

export type CreateAgendamentoInput = z.infer<typeof createAgendamentoSchema>;
export type CancelAgendamentoInput = z.infer<typeof cancelAgendamentoSchema>;
