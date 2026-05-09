import { z } from "zod";

const enderecoSchema = z
  .object({
    cep: z.string().min(8).max(10),
    rua: z.string().min(2).max(120),
    numero: z.string().min(1).max(10),
    cidade: z.string().min(2).max(60),
    uf: z.string().length(2),
  })
  .nullable()
  .optional();

const planoSchema = z
  .object({
    temPlano: z.boolean(),
    operadora: z.string().optional(),
    numeroCarteirinha: z.string().optional(),
  })
  .nullable()
  .optional();

export const createPacienteSchema = z.object({
  nome: z.string().min(2).max(120),
  email: z.string().email(),
  telefone: z.string().min(8).max(20),
  cpf: z.string().min(11).max(14).optional().nullable(),
  dataNascimento: z.string().date().optional().nullable(),
  sexo: z.enum(["M", "F", "outro"]).optional().nullable(),
  endereco: enderecoSchema,
  plano: planoSchema,
});

export const updatePacienteSchema = createPacienteSchema.partial();

export const listPacientesQuerySchema = z.object({
  q: z.string().optional(),
});

export type CreatePacienteInput = z.infer<typeof createPacienteSchema>;
export type UpdatePacienteInput = z.infer<typeof updatePacienteSchema>;
