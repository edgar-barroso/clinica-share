"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";

const NOOP_SUBSCRIBE = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    NOOP_SUBSCRIBE,
    () => true,
    () => false,
  );
import {
  BarChart3,
  Calendar,
  CalendarHeart,
  CalendarPlus,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  FileSearch,
  Home,
  Menu,
  Settings,
  Stethoscope,
  User,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/lib/current-user";
import { useRole } from "@/lib/role";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const navAll: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/consultorios", label: "Consultórios", icon: DoorOpen },
  { href: "/profissionais", label: "Profissionais", icon: Users },
  { href: "/financeiro/repasses", label: "Financeiro", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/auditoria", label: "Auditoria", icon: FileSearch },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const navPaciente: NavItem[] = [
  { href: "/p", label: "Início", icon: Home },
  { href: "/p/consultas", label: "Minhas consultas", icon: CalendarHeart },
  { href: "/p/agendar", label: "Agendar consulta", icon: CalendarPlus },
  { href: "/p/perfil", label: "Meu perfil", icon: User },
];

const navByRole: Record<string, string[]> = {
  admin: navAll.map((n) => n.href),
  auxiliar: ["/dashboard", "/atendimentos", "/financeiro/repasses", "/relatorios", "/auditoria"],
  profissional: ["/agenda", "/atendimentos"],
  atendente: ["/agenda", "/atendimentos"],
  paciente: navPaciente.map((n) => n.href),
};

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  const isClient = useIsClient();
  const pathname = usePathname();
  const { role } = useRole();
  const { profissionalId } = useCurrentUser();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const baseItems =
    role === "paciente"
      ? navPaciente
      : navAll.filter((n) => (navByRole[role] ?? []).includes(n.href));
  const items =
    role === "profissional" && profissionalId
      ? [
          ...baseItems,
          {
            href: `/profissionais/${profissionalId}/editar`,
            label: "Meu perfil",
            icon: User,
          },
        ]
      : baseItems;

  const overlay = open ? (
    <>
      <div
        className="fixed inset-0 z-[60] bg-foreground/40 lg:hidden"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <aside className="fixed inset-y-0 left-0 z-[70] flex w-72 max-w-[85vw] flex-col overflow-y-auto overflow-x-hidden bg-card shadow-xl lg:hidden">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">ClinicaShare</p>
              <p className="text-xs text-muted-foreground leading-tight">
                Gestão de repasses
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex size-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted"
            aria-label="Fechar menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="space-y-1 px-3 py-4">
          {items.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-border px-6 py-4 text-xs text-muted-foreground">
          v0.1.0 · Semana 06-12/abr
        </div>
      </aside>
    </>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex size-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu size={20} />
      </button>

      {isClient && overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}
