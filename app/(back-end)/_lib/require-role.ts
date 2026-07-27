import type { NextRequest } from "next/server";
import type { Role, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { readAuthCookie } from "./auth-cookie";
import { verifyAuthToken, type AuthTokenPayload } from "./jwt";
import { NaoAutenticado, NaoAutorizado } from "./errors";
import { isSessionIdle, touchUltimoAcesso } from "./session-activity";

/**
 * Validação de autorização **rápida** — em runtime, lê os headers
 * `x-user-id`/`x-user-role` injetados pelo `proxy.ts` (que já validou
 * o JWT no Edge). Em testes que chamam handlers direto (sem proxy),
 * cai no fallback de ler o cookie e re-verificar o JWT.
 *
 * Defense-in-depth: se o proxy falhar/for bypassed, o fallback de
 * cookie ainda protege a rota.
 *
 * Caveat: o `role` no JWT fica congelado até o token expirar
 * (`SESSION_IDLE_MINUTES`, default 30min — ver RF-024). Se um admin
 * alterar o role de outro usuário, o token antigo ainda carrega o role
 * antigo até a próxima renovação/expiração. Para MVP é aceitável.
 *
 * @throws {NaoAutenticado} headers ausentes E cookie ausente/JWT inválido
 * @throws {NaoAutorizado} payload válido mas role fora da allowlist
 */
export function requireRole(
  req: NextRequest,
  allowedRoles: Role[],
): AuthTokenPayload {
  // Fast path: headers injetados pelo proxy
  const headerUserId = req.headers.get("x-user-id");
  const headerRole = req.headers.get("x-user-role");
  let payload: AuthTokenPayload;

  if (headerUserId && headerRole) {
    payload = { userId: headerUserId, role: headerRole as Role };
  } else {
    // Fallback: testes que chamam handlers direto (sem proxy)
    const token = readAuthCookie(req);
    if (!token) throw new NaoAutenticado();
    try {
      payload = verifyAuthToken(token);
    } catch {
      throw new NaoAutenticado();
    }
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
 * [RF-024] E valida inatividade: se `now - ultimoAcesso` passou de
 * `SESSION_IDLE_MINUTES`, a sessão está encerrada (`NaoAutenticado` →
 * 401), independente do cookie que o cliente apresentou. Quando a sessão
 * está viva, renova o heartbeat `ultimoAcesso` (throttle de 1x/min).
 *
 * @param allowedRoles `undefined` ou `[]` = qualquer role autenticado
 * @throws {NaoAutenticado} user inexistente, desativado ou sessão inativa
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

  if (isSessionIdle(user.ultimoAcesso)) {
    throw new NaoAutenticado();
  }

  const ultimoAcesso = await touchUltimoAcesso(user.id, user.ultimoAcesso);
  return { ...user, ultimoAcesso };
}
