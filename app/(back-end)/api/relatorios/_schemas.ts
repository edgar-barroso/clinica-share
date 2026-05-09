import { z } from "zod";

export const periodoSchema = z
  .object({
    dataInicio: z.string().date(),
    dataFim: z.string().date(),
  })
  .refine((v) => v.dataFim >= v.dataInicio, {
    message: "dataFim deve ser >= dataInicio",
    path: ["dataFim"],
  });

export const relatorioFinanceiroSchema = z
  .object({
    dataInicio: z.string().date(),
    dataFim: z.string().date(),
    profissionalId: z.string().optional(),
    consultorioId: z.string().optional(),
  })
  .refine((v) => v.dataFim >= v.dataInicio, {
    message: "dataFim deve ser >= dataInicio",
    path: ["dataFim"],
  });
