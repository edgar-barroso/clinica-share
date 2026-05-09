import { z } from "zod";

export const gerarRepasseSchema = z
  .object({
    profissionalId: z.string().min(1),
    periodoInicio: z.string().date(),
    periodoFim: z.string().date(),
  })
  .refine((v) => v.periodoFim >= v.periodoInicio, {
    message: "periodoFim deve ser >= periodoInicio",
    path: ["periodoFim"],
  });

export const marcarPagoSchema = z.object({
  motivo: z.string().min(3).max(200).optional(),
});

export const listRepassesQuerySchema = z.object({
  profissionalId: z.string().optional(),
  status: z.enum(["aberto", "pago"]).optional(),
  periodoInicio: z.string().date().optional(),
  periodoFim: z.string().date().optional(),
});

export type GerarRepasseInput = z.infer<typeof gerarRepasseSchema>;
export type MarcarPagoInput = z.infer<typeof marcarPagoSchema>;
export type ListRepassesQuery = z.infer<typeof listRepassesQuerySchema>;
