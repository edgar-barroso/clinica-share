import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";
import { env } from "@/lib/env";
import { SESSION_IDLE_SECONDS } from "@/lib/session-idle";
import { TokenInvalido } from "./errors";

/**
 * [RF-024] O TTL do token É a janela de inatividade (não um TTL absoluto).
 * O `proxy.ts` reassina o token a cada requisição autenticada
 * (sliding expiration), então um usuário ativo nunca é deslogado; um
 * usuário parado por `SESSION_IDLE_MINUTES` tem o token expirado pelo
 * próprio `jwt.verify` — sem depender de nada no cliente.
 */
const EXPIRES_IN = SESSION_IDLE_SECONDS;

export interface AuthTokenPayload {
  userId: string;
  role: Role;
  /**
   * Emissão do token, em segundos (padrão JWT). Usado para recusar tokens
   * anteriores ao último logout do usuário — ver `sessoesInvalidadasEm`.
   * Ausente só em tokens montados à mão em teste.
   */
  iat?: number;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (typeof decoded !== "object" || !decoded) throw new TokenInvalido();
    const { userId, role, iat } = decoded as Partial<AuthTokenPayload>;
    if (!userId || !role) throw new TokenInvalido();
    return { userId, role, iat };
  } catch {
    throw new TokenInvalido();
  }
}
