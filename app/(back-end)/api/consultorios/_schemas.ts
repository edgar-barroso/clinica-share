import { z } from "zod";

export const dashboardConsultoriosSchema = z
  .object({
    dataInicio: z.string().date(),
    dataFim: z.string().date(),
    modalidade: z.enum(["aluguel_fixo", "percentual", "todos"]).optional(),
  })
  .refine((v) => v.dataFim >= v.dataInicio, {
    message: "dataFim deve ser >= dataInicio",
    path: ["dataFim"],
  });

export const detalheConsultorioSchema = z
  .object({
    dataInicio: z.string().date(),
    dataFim: z.string().date(),
  })
  .refine((v) => v.dataFim >= v.dataInicio, {
    message: "dataFim deve ser >= dataInicio",
    path: ["dataFim"],
  });

export type DashboardConsultoriosInput = z.infer<
  typeof dashboardConsultoriosSchema
>;
export type DetalheConsultorioInput = z.infer<typeof detalheConsultorioSchema>;

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
