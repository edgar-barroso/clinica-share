import { z } from "zod";

export const createStaffSchema = z.object({
  nome: z.string().min(2).max(120),
  cargo: z.enum(["atendente", "auxiliar"]),
  email: z.string().email(),
  telefone: z.string().min(8).max(20),
});

export const updateStaffSchema = createStaffSchema.partial().extend({
  ativo: z.boolean().optional(),
});

export const listStaffQuerySchema = z.object({
  ativo: z
    .enum(["true", "false", "all"])
    .optional()
    .transform((v) => (v === undefined || v === "all" ? undefined : v === "true")),
  cargo: z.enum(["atendente", "auxiliar"]).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
