import type { NextRequest } from "next/server";
import type { Role, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readAuthCookie } from "./auth-cookie";
import { verifyAuthToken, type AuthTokenPayload } from "./jwt";
import { NaoAutenticado, NaoAutorizado } from "./errors";

/**
 * Validação de autorização **rápida** — usa apenas o JWT do cookie,
 * sem consulta ao banco. Adequado para 99% das rotas que só precisam
 * saber `userId` e `role` para gating.
 *
 * Caveat: o `role` no JWT fica congelado até o token expirar (7d).
 * Se um admin alterar o role de outro usuário, o token antigo ainda
 * carrega o role antigo. Para MVP é aceitável; em produção mitigar
 * com TTL menor + refresh.
 *
 * @throws {NaoAutenticado} cookie ausente ou JWT inválido/expirado
 * @throws {NaoAutorizado} JWT válido mas role fora da allowlist
 */
export function requireRole(
  req: NextRequest,
  allowedRoles: Role[],
): AuthTokenPayload {
  const token = readAuthCookie(req);
  if (!token) throw new NaoAutenticado();

  let payload: AuthTokenPayload;
  try {
    payload = verifyAuthToken(token);
  } catch {
    throw new NaoAutenticado();
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
    throw new NaoAutorizado();
  }
  return payload;
}

type UserWithRelations = Prisma.UserGetPayload<{
  include: { paciente: true; profissional: true; staff: true };
}>;

/**
 * Validação completa — JWT **e** lookup no DB. Use quando o handler
 * precisa do User completo (com relações) para criar audit log,
 * ler `profissionalId`, `pacienteId`, etc.
 *
 * Também valida `ativo: true` — usuários desativados são bloqueados
 * mesmo com JWT ainda válido.
 *
 * @param allowedRoles `undefined` ou `[]` = qualquer role autenticado
 */
export async function requireUser(
  req: NextRequest,
  allowedRoles?: Role[],
): Promise<UserWithRelations> {
  const payload = requireRole(req, allowedRoles ?? []);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    include: { paciente: true, profissional: true, staff: true },
  });

  if (!user || !user.ativo) {
    throw new NaoAutenticado();
  }
  return user;
}
