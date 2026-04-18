"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "admin" | "auxiliar" | "profissional" | "atendente" | "paciente";

export interface RoleInfo {
  id: Role;
  label: string;
  subtitle: string;
  initials: string;
  name: string;
}

export const ROLES: Record<Role, RoleInfo> = {
  admin: {
    id: "admin",
    label: "Administrador",
    subtitle: "Dr. Edson Andrade",
    initials: "EA",
    name: "Dr. Edson Andrade",
  },
  auxiliar: {
    id: "auxiliar",
    label: "Auxiliar Financeiro",
    subtitle: "Joana Ribeiro",
    initials: "JR",
    name: "Joana Ribeiro",
  },
  profissional: {
    id: "profissional",
    label: "Profissional",
    subtitle: "Dra. Nirmala Azalea",
    initials: "NA",
    name: "Dra. Nirmala Azalea",
  },
  atendente: {
    id: "atendente",
    label: "Atendente",
    subtitle: "Carla Moreira",
    initials: "CM",
    name: "Carla Moreira",
  },
  paciente: {
    id: "paciente",
    label: "Paciente",
    subtitle: "João Pereira",
    initials: "JP",
    name: "João Pereira",
  },
};

interface RoleContextValue {
  role: Role;
  info: RoleInfo;
  setRole: (r: Role) => void;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "clinicashare:role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved && saved in ROLES) {
      setRoleState(saved as Role);
    }
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, r);
    }
  };

  return (
    <RoleContext.Provider value={{ role, info: ROLES[role], setRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole deve ser usado dentro de <RoleProvider>");
  return ctx;
}
