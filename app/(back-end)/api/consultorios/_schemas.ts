import { z } from "zod";

export const createConsultorioSchema = z.object({
  nome: z.string().min(2, "Nome muito curto").max(80, "Nome muito longo"),
  tipo: z.string().min(2, "Tipo muito curto").max(60),
  equipamentos: z.array(z.string().min(1)).default([]),
  especialidadesCompativeis: z.array(z.string().min(1)).default([]),
});

export const updateConsultorioSchema = createConsultorioSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const listConsultoriosQuerySchema = z.object({
  ativo: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === undefined || v === "all" ? undefined : v === "true")),
});

export type CreateConsultorioInput = z.infer<typeof createConsultorioSchema>;
export type UpdateConsultorioInput = z.infer<typeof updateConsultorioSchema>;
