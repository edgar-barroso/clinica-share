/**
 * [RF-024] Encerramento automático de sessão após inatividade.
 *
 * Fonte única de verdade da janela de inatividade. É consumido em três
 * runtimes diferentes:
 *   - Node (assinatura do JWT, `maxAge` do cookie, `require-role.ts`);
 *   - Edge (`proxy.ts`, que renova o cookie a cada requisição);
 *   - Server Component (`app-shell.tsx`, que passa o valor pro guard do cliente).
 *
 * Por isso lê `process.env` direto em vez de `@/lib/env` — o schema de
 * `lib/env.ts` valida variáveis (DATABASE_URL, credenciais de e-mail) que
 * não existem no bundle do Edge runtime. `lib/env.ts` também declara
 * `SESSION_IDLE_MINUTES` para validar/documentar o valor no boot do Node.
 */

/** Default do RF-024 quando `SESSION_IDLE_MINUTES` não está configurada. */
export const DEFAULT_SESSION_IDLE_MINUTES = 30;

export function parseIdleMinutes(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!raw || !Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SESSION_IDLE_MINUTES;
  }
  return Math.floor(parsed);
}

/** Minutos de inatividade tolerados antes do encerramento da sessão. */
export const SESSION_IDLE_MINUTES = parseIdleMinutes(
  process.env.SESSION_IDLE_MINUTES,
);

export const SESSION_IDLE_SECONDS = SESSION_IDLE_MINUTES * 60;
export const SESSION_IDLE_MS = SESSION_IDLE_SECONDS * 1000;

/**
 * Throttle de escrita de `User.ultimoAcesso`: no máximo 1 UPDATE por
 * minuto por usuário. Sem isso, toda request autenticada viraria um write.
 *
 * Note que o JWT/cookie NÃO é throttled — o `proxy.ts` reassina em toda
 * requisição autenticada (custo de um HS256 no Edge, sem I/O), o que faz a
 * janela valer exatamente `SESSION_IDLE_MINUTES` em qualquer rota,
 * inclusive nas 12 que usam `requireRole` e nunca tocam o banco.
 */
export const ULTIMO_ACESSO_THROTTLE_MS = 60 * 1000;
