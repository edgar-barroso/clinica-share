import { z } from "zod";

const valorConsultaSchema = z
  .number()
  .min(0, "Valor não pode ser negativo")
  .max(99999999.99, "Valor acima do permitido");

const statusPagamentoSchema = z.enum(["pago", "pendente", "gratuito"]);

/**
 * AT02: procedimento extra realizado no atendimento, registrado
 * individualmente com valor próprio. FI04 soma estes valores na base do
 * repasse — mutação financeira, portanto auditada (RNF-102).
 */
const procedimentoSchema = z.object({
  descricao: z
    .string()
    .min(2, "Descrição do procedimento deve ter no mínimo 2 caracteres")
    .max(120, "Descrição do procedimento deve ter no máximo 120 caracteres"),
  valor: z
    .number()
    .min(0, "Valor do procedimento não pode ser negativo")
    .max(99999999.99, "Valor do procedimento acima do permitido"),
});

/**
 * Lista completa de procedimentos do atendimento. Quando enviada, SUBSTITUI
 * a lista existente; quando omitida, a lista atual é preservada.
 */
const procedimentosSchema = z
  .array(procedimentoSchema)
  .max(20, "Máximo de 20 procedimentos por atendimento");

/**
 * AT04 — prontuário externo. Campos aceitos por todos os endpoints de escrita
 * de atendimento.
 */
const prontuarioExternoFields = {
  usaProntuarioExterno: z.boolean().optional(),
  referenciaProntuarioExterno: z
    .string()
    .min(3, "Informe onde o prontuário externo está registrado (mínimo 3 caracteres)")
    .max(200)
    .nullable()
    .optional(),
};

/**
 * Marcar "prontuário externo" sem dizer onde ele está seria uma caixinha sem
 * rastro — a ocorrência precisa ser registrada, que é o que o AT04 pede.
 * Só valida quando o campo é enviado explicitamente como `true`, para não
 * quebrar chamadas que nem mencionam prontuário externo.
 */
function exigeReferenciaExterna(v: {
  usaProntuarioExterno?: boolean;
  referenciaProntuarioExterno?: string | null;
}) {
  return (
    v.usaProntuarioExterno !== true ||
    (typeof v.referenciaProntuarioExterno === "string" &&
      v.referenciaProntuarioExterno.trim().length >= 3)
  );
}

const ERRO_REFERENCIA_EXTERNA = {
  message:
    "Informe a referência do prontuário externo (onde o registro foi feito) — AT04",
  path: ["referenciaProntuarioExterno"],
};

/**
 * FI06 — desconto parcial. `valorOriginal` é o preço de tabela; cobrar abaixo
 * dele é um desconto e exige justificativa, do mesmo jeito que a gratuidade.
 */
const valorOriginalSchema = z
  .number()
  .nonnegative("Valor original não pode ser negativo")
  .max(99999999.99)
  .optional();

function exigeMotivoDesconto(v: {
  valorConsulta?: number;
  valorOriginal?: number;
  motivoDescontoOuGratuidade?: string | null;
}) {
  const houveDesconto =
    v.valorOriginal !== undefined &&
    v.valorConsulta !== undefined &&
    v.valorConsulta < v.valorOriginal;
  return (
    !houveDesconto ||
    (typeof v.motivoDescontoOuGratuidade === "string" &&
      v.motivoDescontoOuGratuidade.trim().length >= 3)
  );
}

const ERRO_MOTIVO_DESCONTO = {
  message:
    "Motivo é obrigatório quando o valor cobrado é menor que o valor de tabela (FI06)",
  path: ["motivoDescontoOuGratuidade"],
};

/** Valor de tabela não pode ser menor que o cobrado — seria desconto negativo. */
const ERRO_VALOR_ORIGINAL = {
  message: "Valor de tabela não pode ser menor que o valor cobrado",
  path: ["valorOriginal"],
};

function valorOriginalCoerente(v: {
  valorConsulta?: number;
  valorOriginal?: number;
}) {
  return (
    v.valorOriginal === undefined ||
    v.valorConsulta === undefined ||
    v.valorOriginal >= v.valorConsulta
  );
}

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
    valorOriginal: valorOriginalSchema,
    statusPagamento: statusPagamentoSchema,
    motivoDescontoOuGratuidade: z.string().max(200).optional(),
    prontuarioInterno: z.unknown().optional(),
    observacoes: z.string().max(500).optional(),
    procedimentos: procedimentosSchema.optional(),
    ...prontuarioExternoFields,
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
  )
  .refine(exigeReferenciaExterna, ERRO_REFERENCIA_EXTERNA)
  .refine(valorOriginalCoerente, ERRO_VALOR_ORIGINAL)
  .refine(exigeMotivoDesconto, ERRO_MOTIVO_DESCONTO);

/**
 * AT06: finaliza um atendimento que está `em_atendimento`. Body inclui
 * valor cobrado, status de pagamento e prontuário. Se gratuito, motivo
 * obrigatório (FI06).
 */
export const finalizarAtendimentoSchema = z
  .object({
    valorConsulta: valorConsultaSchema,
    valorOriginal: valorOriginalSchema,
    statusPagamento: statusPagamentoSchema,
    motivoDescontoOuGratuidade: z.string().max(200).optional(),
    prontuarioInterno: z.unknown().optional(),
    observacoes: z.string().max(500).optional(),
    procedimentos: procedimentosSchema.optional(),
    ...prontuarioExternoFields,
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
  )
  .refine(exigeReferenciaExterna, ERRO_REFERENCIA_EXTERNA)
  .refine(valorOriginalCoerente, ERRO_VALOR_ORIGINAL)
  .refine(exigeMotivoDesconto, ERRO_MOTIVO_DESCONTO);

/**
 * FI11: edição pós-realizado (somente admin/auxiliar — PEND-031).
 * Motivo obrigatório porque é audit-relevante (RNF-102).
 */
export const updateAtendimentoSchema = z
  .object({
    valorConsulta: valorConsultaSchema.optional(),
    valorOriginal: valorOriginalSchema,
    statusPagamento: statusPagamentoSchema.optional(),
    motivoDescontoOuGratuidade: z.string().max(200).nullable().optional(),
    prontuarioInterno: z.unknown().optional(),
    observacoes: z.string().max(500).nullable().optional(),
    procedimentos: procedimentosSchema.optional(),
    ...prontuarioExternoFields,
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
  )
  .refine(exigeReferenciaExterna, ERRO_REFERENCIA_EXTERNA)
  .refine(valorOriginalCoerente, ERRO_VALOR_ORIGINAL)
  .refine(exigeMotivoDesconto, ERRO_MOTIVO_DESCONTO);

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

export type ProcedimentoAtendimentoInput = z.infer<typeof procedimentoSchema>;
export type CreateWalkInInput = z.infer<typeof createWalkInSchema>;
export type FinalizarAtendimentoInput = z.infer<typeof finalizarAtendimentoSchema>;
export type UpdateAtendimentoInput = z.infer<typeof updateAtendimentoSchema>;
export type ListAtendimentosFilter = z.infer<typeof listAtendimentosQuerySchema>;
