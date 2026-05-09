"use client";

import { ROLES, useRole, type Role } from "@/lib/role";

export interface CurrentUser {
  role: Role;
  userId: string;
  userNome: string;
  email: string;
  profissionalId: string | null;
  pacienteId: string | null;
  staffId: string | null;
  /** True enquanto /api/auth/me ainda não respondeu no boot. */
  loading: boolean;
  /** True se o boot terminou e nenhum usuário está logado. */
  anonymous: boolean;
}

/**
 * Hook que retorna o usuário logado vindo do `RoleProvider`, que por sua vez
 * lê de `/api/auth/me` no boot (DEC-P09). Antes do login não há usuário —
 * use `anonymous` para distinguir "ainda carregando" de "ninguém logado".
 */
export function useCurrentUser(): CurrentUser {
  const { role, info, user, loading } = useRole();
  const anonymous = !loading && user === null;

  return {
    role,
    userId: user?.id ?? "",
    userNome: info.name,
    email: user?.email ?? "",
    profissionalId: user?.profissionalId ?? null,
    pacienteId: user?.pacienteId ?? null,
    staffId: user?.staffId ?? null,
    loading,
    anonymous,
  };
}

export function roleLabel(role: Role): string {
  return ROLES[role].label;
}
