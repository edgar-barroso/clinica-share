"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  FileSearch,
  Menu,
  Settings,
  Stethoscope,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useRole } from "@/lib/role";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const navAll: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/atendimentos", label: "Atendimentos", icon: ClipboardList },
  { href: "/consultorios", label: "Consultórios", icon: DoorOpen },
  { href: "/profissionais", label: "Profissionais", icon: Users },
  { href: "/financeiro", label: "Financeiro", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { href: "/auditoria", label: "Auditoria", icon: FileSearch },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

const navByRole: Record<string, string[]> = {
  admin: navAll.map((n) => n.href),
  auxiliar: ["/dashboard", "/atendimentos", "/financeiro", "/relatorios", "/auditoria"],
  profissional: ["/dashboard", "/agenda", "/atendimentos"],
  atendente: ["/agenda", "/atendimentos"],
  paciente: [],
};

export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { role } = useRole();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

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

  const allowed = new Set(navByRole[role] ?? []);
  const items = navAll.filter((n) => allowed.has(n.href));

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

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] overflow-y-auto bg-card shadow-xl lg:hidden">
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
              {items.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">
                  Este perfil usa o portal do paciente, não a área administrativa.
                </p>
              )}
              {items.map(({ href, label, icon: Icon }) => {
                const active =
                  pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={href}
                    href={href}
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

            <div className="border-t border-border px-6 py-4 text-xs text-muted-foreground">
              v0.1.0 · Semana 06-12/abr
            </div>
          </aside>
        </>
      )}
    </>
  );
}
