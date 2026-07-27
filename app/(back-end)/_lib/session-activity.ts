/**
 * [RF-024] Encerramento automático de sessão após inatividade — camada de DB.
 *
 * O JWT/cookie já expira por inatividade (ver `jwt.ts` + `proxy.ts`), mas
 * essa expiração vive num artefato que o cliente carrega. Aqui está a
 * verificação **autoritativa**: `User.ultimoAcesso` é o heartbeat da sessão
 * e mora no banco, fora do alcance do cliente. Se o heartbeat está mais
 * velho que a janela, a sessão está encerrada — mesmo que alguém tenha um
 * cookie ainda válido em mãos.
 *
 * Usado por `require-role.ts` (`requireUser`) e `current-user.ts`
 * (`/api/auth/me`), que já fazem lookup do User — a checagem não custa
 * nenhuma query adicional.
 */
import { prisma } from "@/lib/db";
import {
  SESSION_IDLE_MS,
  ULTIMO_ACESSO_THROTTLE_MS,
} from "@/lib/session-idle";

/**
 * `true` quando a sessão passou da janela de inatividade.
 *
 * `ultimoAcesso === null` NÃO é considerado inativo: usuários criados por
 * seed/factory (ou pelo fluxo de registro) nunca passaram pelo login, e
 * bloqueá-los aqui invalidaria tokens legítimos. Nesses casos o TTL do
 * próprio JWT continua sendo o limite, e o primeiro `touch` já grava o
 * heartbeat.
 */
export function isSessionIdle(
  ultimoAcesso: Date | null,
  now = Date.now(),
): boolean {
  if (!ultimoAcesso) return false;
  return now - ultimoAcesso.getTime() > SESSION_IDLE_MS;
}

/**
 * Renova o heartbeat da sessão, no máximo 1 write por minuto por usuário
 * (`ULTIMO_ACESSO_THROTTLE_MS`) — sem isso toda request autenticada viraria
 * um UPDATE. Best-effort: falha de escrita não derruba a request (no pior
 * caso o heartbeat fica velho e a sessão expira mais cedo, que é o lado
 * seguro do trade-off).
 *
 * @returns o `ultimoAcesso` vigente após a chamada.
 */
export async function touchUltimoAcesso(
  userId: string,
  ultimoAcesso: Date | null,
  now = Date.now(),
): Promise<Date | null> {
  const idade = ultimoAcesso ? now - ultimoAcesso.getTime() : Infinity;
  if (idade < ULTIMO_ACESSO_THROTTLE_MS) return ultimoAcesso;

  const novo = new Date(now);
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { ultimoAcesso: novo },
    });
    return novo;
  } catch {
    return ultimoAcesso;
  }
}
