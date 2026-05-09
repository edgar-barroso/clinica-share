import { z } from "zod";

const valorConsultaSchema = z
  .number()
  .min(0, "Valor não pode ser negativo")
  .max(99999999.99, "Valor acima do permitido");

const statusPagamentoSchema = z.enum(["pago", "pendente", "gratuito"]);

/**
 * Walk-in (AT01): registro avulso sem agendamento prévio. Cria
 * Atendimento já com `status=realizado`. Profissional ou admin.
 */
export const createWalkInSchema = z
  .object({
    pacienteId: z.string().min(1),
    profissionalId: z.string().min(1),
    consultorioId: z.string().min(1),
    data: z.string().date(),
    hora: z.string().regex(/^\d{2}:\d{2}$/, "Hora deve estar em formato HH:mm"),
    valorConsulta: valorConsultaSchema,
    statusPagamento: statusPagamentoSchema,
    motivoDescontoOuGratuidade: z.string().max(200).optional(),
    prontuarioInterno: z.unknown().optional(),
    observacoes: z.string().max(500).optional(),
  })
  .refine(
    (v) =>
      v.statusPagamento !== "gratuito" ||
      (v.motivoDescontoOuGratuidade && v.motivoDescontoOuGratuidade.length >= 3),
    {
      message:
        "Motivo é obrigatório quando atendimento é gratuito (FI06)",
      path: ["motivoDescontoOuGratuidade"],
    },
  );

/**
 * AT06: finaliza um atendimento que está `em_atendimento`. Body inclui
 * valor cobrado, status de pagamento e prontuário. Se gratuito, motivo
 * obrigatório (FI06).
 */
export const finalizarAtendimentoSchema = z
  .object({
    valorConsulta: valorConsultaSchema,
    statusPagamento: statusPagamentoSchema,
    motivoDescontoOuGratuidade: z.string().max(200).optional(),
    prontuarioInterno: z.unknown().optional(),
    observacoes: z.string().max(500).optional(),
  })
  .refine(
    (v) =>
      v.statusPagamento !== "gratuito" ||
      (v.motivoDescontoOuGratuidade && v.motivoDescontoOuGratuidade.length >= 3),
    {
      message:
        "Motivo é obrigatório quando atendimento é gratuito (FI06)",
      path: ["motivoDescontoOuGratuidade"],
    },
  );

/**
 * FI11: edição pós-realizado (somente admin/auxiliar — PEND-031).
 * Motivo obrigatório porque é audit-relevante (RNF-102).
 */
export const updateAtendimentoSchema = z
  .object({
    valorConsulta: valorConsultaSchema.optional(),
    statusPagamento: statusPagamentoSchema.optional(),
    motivoDescontoOuGratuidade: z.string().max(200).nullable().optional(),
    prontuarioInterno: z.unknown().optional(),
    observacoes: z.string().max(500).nullable().optional(),
    motivo: z
      .string()
      .min(3, "Motivo da edição é obrigatório (mínimo 3 caracteres)")
      .max(200),
  })
  .refine(
    (v) =>
      Object.keys(v).filter((k) => k !== "motivo").length > 0 &&
      Object.entries(v).some(
        ([k, val]) => k !== "motivo" && val !== undefined,
      ),
    {
      message: "Pelo menos um campo (além de motivo) deve ser fornecido",
      path: ["motivo"],
    },
  );

export const listAtendimentosQuerySchema = z.object({
  data: z.string().date().optional(),
  dataInicio: z.string().date().optional(),
  dataFim: z.string().date().optional(),
  profissionalId: z.string().optional(),
  pacienteId: z.string().optional(),
  consultorioId: z.string().optional(),
  status: z
    .enum(["agendado", "em_atendimento", "realizado", "cancelado", "nao_compareceu"])
    .optional(),
  statusPagamento: statusPagamentoSchema.optional(),
});

export type CreateWalkInInput = z.infer<typeof createWalkInSchema>;
export type FinalizarAtendimentoInput = z.infer<typeof finalizarAtendimentoSchema>;
export type UpdateAtendimentoInput = z.infer<typeof updateAtendimentoSchema>;
export type ListAtendimentosFilter = z.infer<typeof listAtendimentosQuerySchema>;
