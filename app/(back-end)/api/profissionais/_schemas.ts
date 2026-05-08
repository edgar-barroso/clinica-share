import { z } from "zod";

const baseProfissionalSchema = z.object({
  nome: z.string().min(2).max(120),
  especialidade: z.string().min(2).max(80),
  conselho: z.string().min(2).max(40),
  email: z.string().email(),
  telefone: z.string().min(8).max(20),
  // 0..1 (ex: 0.30 = 30%) — opcional, obrigatório se modalidade=percentual
  percentualRepasse: z.number().min(0).max(1).nullable().optional(),
  // Decimal armazenado como number aqui; Prisma converte
  valorAluguelPorTurno: z.number().min(0).nullable().optional(),
  duracaoConsultaMinutos: z.number().int().min(10).max(240).default(30),
  modalidadeContrato: z.enum(["aluguel_fixo", "percentual"]),
});

/**
 * Validação cruzada: modalidade percentual exige `percentualRepasse`,
 * modalidade aluguel-fixo exige `valorAluguelPorTurno`.
 */
export const createProfissionalSchema = baseProfissionalSchema.refine(
  (data) => {
    if (data.modalidadeContrato === "percentual") {
      return data.percentualRepasse !== undefined && data.percentualRepasse !== null;
    }
    if (data.modalidadeContrato === "aluguel_fixo") {
      return data.valorAluguelPorTurno !== undefined && data.valorAluguelPorTurno !== null;
    }
    return true;
  },
  {
    message:
      "modalidade percentual exige percentualRepasse; modalidade aluguel_fixo exige valorAluguelPorTurno",
    path: ["modalidadeContrato"],
  },
);

export const updateProfissionalSchema = baseProfissionalSchema.partial().extend({
  ativo: z.boolean().optional(),
  /**
   * Justificativa da alteração de contrato — obrigatória quando o PATCH
   * altera `modalidadeContrato`, `percentualRepasse` ou `valorAluguelPorTurno`
   * (RNF-102 / FI01).
   */
  motivo: z.string().min(3).max(200).optional(),
});

export const listProfissionaisQuerySchema = z.object({
  ativo: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === undefined || v === "all" ? undefined : v === "true")),
});

export const createTurnoFixoSchema = z.object({
  consultorioId: z.string().min(1),
  diaSemana: z.number().int().min(1).max(5),
  turno: z.enum(["manha", "tarde", "noite"]),
});

export type CreateProfissionalInput = z.infer<typeof createProfissionalSchema>;
export type UpdateProfissionalInput = z.infer<typeof updateProfissionalSchema>;
export type CreateTurnoFixoInput = z.infer<typeof createTurnoFixoSchema>;
