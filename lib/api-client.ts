/**
 * Cliente HTTP genérico para chamadas a `/api/*` no mesmo origin.
 *
 * Convenções:
 * - `credentials: "same-origin"` — envia cookie `auth-token` automaticamente
 * - Todos os erros (incluindo 4xx/5xx) lançam um objeto com forma `ApiError`
 * - Respostas são tipadas pelo chamador via genérico
 *
 * Para auth específico, ver também `lib/auth-client.ts` (que reusa este).
 */

export interface ApiError {
  error: string;
  issues?: Record<string, string[] | undefined>;
  status: number;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    "status" in value
  );
}

export function apiErrorMessage(err: unknown): string {
  if (isApiError(err)) return err.error;
  if (err instanceof Error) return err.message;
  return "Erro inesperado";
}

async function request<T>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(path, init);
  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err: ApiError = {
      error: data?.error ?? "Erro inesperado",
      issues: data?.issues,
      status: res.status,
    };
    throw err;
  }
  return data as T;
}

export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: unknown) => request<T>("POST", path, body);
export const apiPatch = <T>(path: string, body?: unknown) => request<T>("PATCH", path, body);
export const apiPut = <T>(path: string, body?: unknown) => request<T>("PUT", path, body);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
