/**
 * Navegação por perfil — FONTE ÚNICA.
 *
 * Antes isto vivia duplicado em `sidebar.tsx` e `mobile-sidebar.tsx`, e as duas
 * cópias já tinham divergido: o menu mobile do admin não tinha "Equipe", e o do
 * profissional apontava para `/agenda` (a agenda da clínica inteira) em vez de
 * `/minha-agenda`. O destino pós-login era uma terceira cópia, em
 * `auth-client.ts`, e mandava o profissional para `/dashboard` — uma tela que
 * nem aparece no menu dele e cujas chamadas devolvem 403, o que fazia o login
 * terminar num toast de "Acesso negado para este perfil".
 *
 * Agora menu e destino pós-login saem da mesma tabela: o usuário sempre cai na
 * primeira página à qual ele tem acesso.
 */
import type { Role } from "@prisma/client";
import {
  BarChart3,
  Calendar,
  CalendarHeart,
  CalendarPlus,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  FileSearch,
  Headset,
  Heart,
  Home,
  Settings,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Catálogo completo das telas administrativas, na ordem em que aparecem. */
export const NAV_CLINICA: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/pacientes", label: "Pacientes", icon: Heart },
  { href: "/consultorios", label: "Consultórios", icon: DoorOpen },
  { href: "/profissionais", label: "Profissionais", icon: Users },
  { href: "/equipe", label: "Equipe", icon: Headset },
  { href: "/financeiro/repasses", label: "Financeiro", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/auditoria", label: "Auditoria", icon: FileSearch },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

/** Portal do paciente — shell próprio, fora das telas da clínica. */
export const NAV_PACIENTE: NavItem[] = [
  { href: "/p", label: "Início", icon: Home },
  { href: "/p/consultas", label: "Minhas consultas", icon: CalendarHeart },
  { href: "/p/agendar", label: "Agendar consulta", icon: CalendarPlus },
  { href: "/p/perfil", label: "Meu perfil", icon: User },
];

/**
 * Profissional vê `/minha-agenda`, NÃO `/agenda`: a segunda mostra a agenda de
 * toda a clínica e contraria o isolamento entre profissionais (RF-023).
 */
export const NAV_PROFISSIONAL: NavItem[] = [
  { href: "/minha-agenda", label: "Minha agenda", icon: Calendar },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
];

/** Telas da clínica liberadas por perfil, na ordem de `NAV_CLINICA`. */
const HREFS_DA_CLINICA_POR_PAPEL: Record<string, string[]> = {
  admin: NAV_CLINICA.map((n) => n.href),
  auxiliar: [
    "/dashboard",
    "/atendimentos",
    "/pacientes",
    "/financeiro/repasses",
    "/relatorios",
    "/auditoria",
  ],
  atendente: ["/agenda", "/atendimentos", "/pacientes"],
};

/**
 * Itens de menu do perfil. `profissionalId`, quando informado, acrescenta o
 * atalho "Meu perfil" do profissional (a rota depende do id dele).
 */
export function navDoPapel(
  role: string | null | undefined,
  opts?: { profissionalId?: string | null },
): NavItem[] {
  if (role === "paciente") return NAV_PACIENTE;
  if (role === "profissional") {
    return opts?.profissionalId
      ? [
          ...NAV_PROFISSIONAL,
          {
            href: `/profissionais/${opts.profissionalId}/editar`,
            label: "Meu perfil",
            icon: User,
          },
        ]
      : NAV_PROFISSIONAL;
  }
  const liberadas = HREFS_DA_CLINICA_POR_PAPEL[role ?? ""] ?? [];
  return NAV_CLINICA.filter((n) => liberadas.includes(n.href));
}

/**
 * Primeira página à qual o perfil tem acesso — é para cá que o login manda.
 * Derivado do menu, então não há como o destino apontar para uma tela que o
 * usuário não pode abrir.
 */
export function primeiraRotaDoPapel(role: string | null | undefined): string {
  return navDoPapel(role)[0]?.href ?? "/login";
}

/** Destino pós-login por perfil. */
export const ROLE_REDIRECT: Record<Role, string> = {
  admin: primeiraRotaDoPapel("admin"),
  auxiliar: primeiraRotaDoPapel("auxiliar"),
  profissional: primeiraRotaDoPapel("profissional"),
  atendente: primeiraRotaDoPapel("atendente"),
  paciente: primeiraRotaDoPapel("paciente"),
};
