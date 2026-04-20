"use client";

import { ROLES, useRole, type Role } from "@/lib/role";

const ROLE_TO_PROFISSIONAL_ID: Partial<Record<Role, string>> = {
  profissional: "p01",
};

const ROLE_TO_PACIENTE_ID: Partial<Record<Role, string>> = {
  paciente: "pt01",
};

export interface CurrentUser {
  role: Role;
  userId: string;
  userNome: string;
  profissionalId: string | null;
  pacienteId: string | null;
}

export function useCurrentUser(): CurrentUser {
  const { role, info } = useRole();
  return {
    role,
    userId: role,
    userNome: info.name,
    profissionalId: ROLE_TO_PROFISSIONAL_ID[role] ?? null,
    pacienteId: ROLE_TO_PACIENTE_ID[role] ?? null,
  };
}

export function roleLabel(role: Role): string {
  return ROLES[role].label;
}
