"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiMe, type AuthUser } from "./auth-client";

export type Role = "admin" | "auxiliar" | "profissional" | "atendente" | "paciente";

export interface RoleInfo {
  id: Role;
  label: string;
  /** Subtítulo padrão (placeholder até user real ser carregado). */
  subtitle: string;
  initials: string;
  /** Nome padrão (placeholder até user real ser carregado). */
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
  /** Usuário real vindo de /api/auth/me, ou null enquanto não autenticado/carregando. */
  user: AuthUser | null;
  /** True enquanto o boot inicial de /api/auth/me ainda não respondeu. */
  loading: boolean;
  /**
   * Define o role localmente. Após login bem-sucedido, o `apiLogin` retorna
   * o usuário e o caller pode chamar `setRole(user.role)` para atualizar a UI
   * imediatamente sem esperar o próximo /me.
   */
  setRole: (r: Role) => void;
  /**
   * Popula o user (e role) imediatamente após login. Evita race entre o
   * push de rota e o /api/auth/me próximo (que pode não disparar a tempo,
   * deixando user=null e quebrando páginas que dependem de pacienteId).
   */
  setUser: (user: AuthUser | null) => void;
  /** Re-busca o usuário em /api/auth/me. Útil após mutações no perfil. */
  refresh: () => Promise<void>;
}

const RoleContext = createContext<RoleContextValue | null>(null);

function deriveInfo(role: Role, user: AuthUser | null): RoleInfo {
  const base = ROLES[role];
  if (!user) return base;
  const realName =
    user.paciente?.nome ?? user.profissional?.nome ?? user.staff?.nome ?? user.email;
  const initials = realName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || base.initials;
  return { ...base, name: realName, subtitle: realName, initials };
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("paciente");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const me = await apiMe();
    if (me) {
      setUser(me);
      setRoleState(me.role);
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setRole = useCallback((r: Role) => {
    setRoleState(r);
  }, []);

  const setUserOptimistic = useCallback((u: AuthUser | null) => {
    setUser(u);
    if (u) setRoleState(u.role);
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        info: deriveInfo(role, user),
        user,
        loading,
        setRole,
        setUser: setUserOptimistic,
        refresh,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole deve ser usado dentro de <RoleProvider>");
  return ctx;
}
