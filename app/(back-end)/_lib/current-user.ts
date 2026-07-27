import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { readAuthCookie } from "./auth-cookie";
import { verifyAuthToken } from "./jwt";
import { NaoAutenticado } from "./errors";
import { isSessionIdle, touchUltimoAcesso } from "./session-activity";

/**
 * [RF-024] Além do JWT, valida a janela de inatividade contra
 * `User.ultimoAcesso` — `/api/auth/me` devolve 401 quando a sessão já
 * expirou, e o `RoleProvider` derruba o usuário no boot. Quando a sessão
 * está viva, renova o heartbeat (throttle de 1x/min) — é isso que faz o
 * keepalive do `IdleSessionGuard` deslizar a janela no servidor.
 */
export async function getUserFromRequest(req: NextRequest) {
  const token = readAuthCookie(req);
  if (!token) return null;
  try {
    const { userId } = verifyAuthToken(token);
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { paciente: true, profissional: true, staff: true },
    });
    if (!user) return null;
    if (isSessionIdle(user.ultimoAcesso)) return null;

    const ultimoAcesso = await touchUltimoAcesso(user.id, user.ultimoAcesso);
    return { ...user, ultimoAcesso };
  } catch {
    return null;
  }
}

export async function requireUserFromRequest(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) throw new NaoAutenticado();
  return user;
}
