import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  nome: z.string().min(2, "Nome muito curto").max(120, "Nome muito longo"),
  email: z.string().email("E-mail inválido"),
  telefone: z.string().min(8, "Telefone inválido").max(20, "Telefone inválido"),
  senha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("E-mail inválido"),
  token: z.string().min(1, "Token é obrigatório"),
  novaSenha: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
});

export const googleSchema = z.object({
  idToken: z.string().min(1, "idToken é obrigatório"),
});
