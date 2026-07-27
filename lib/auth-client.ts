import type { Role } from "./role";

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  ativo: boolean;
  pacienteId: string | null;
  profissionalId: string | null;
  staffId: string | null;
  paciente: { id: string; nome: string } | null;
  profissional: { id: string; nome: string } | null;
  staff: { id: string; nome: string } | null;
}

export interface AuthError {
  error: string;
  issues?: Record<string, string[] | undefined>;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: "same-origin",
  });
  const data = (await res.json().catch(() => null)) as T | AuthError | null;
  if (!res.ok) {
    const err = (data as AuthError | null) ?? { error: "Erro inesperado" };
    throw err;
  }
  return data as T;
}

export async function apiLogin(input: { email: string; senha: string }) {
  return postJson<{ user: AuthUser }>("/api/auth/login", input);
}

export async function apiRegister(input: {
  nome: string;
  email: string;
  telefone: string;
  senha: string;
}) {
  return postJson<{ user: AuthUser }>("/api/auth/register", input);
}

export async function apiForgotPassword(input: { email: string }) {
  return postJson<{ ok: true }>("/api/auth/forgot-password", input);
}

export async function apiResetPassword(input: {
  email: string;
  token: string;
  novaSenha: string;
}) {
  return postJson<{ ok: true }>("/api/auth/reset-password", input);
}

export async function apiGoogle(input: { idToken: string }) {
  return postJson<{ user: AuthUser }>("/api/auth/google", input);
}

export async function apiLogout() {
  return postJson<{ ok: true }>("/api/auth/logout", {});
}

/**
 * Busca o usuário logado via cookie. Retorna `null` se não autenticado
 * (em vez de throw) — útil para popular `RoleProvider` no boot.
 */
export async function apiMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", {
    method: "GET",
    credentials: "same-origin",
  });
  if (res.status === 401) return null;
  if (!res.ok) return null;
  const data = (await res.json()) as { user: AuthUser };
  return data.user ?? null;
}

export function authErrorMessage(err: unknown): string {
  if (typeof err === "object" && err !== null && "error" in err) {
    return String((err as AuthError).error);
  }
  return "Erro inesperado";
}

// Destino pós-login: derivado do menu do perfil em `lib/nav.ts`, para o
// login nunca cair numa tela que o usuário não pode abrir.
export { ROLE_REDIRECT } from "./nav";
