"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calendar,
  ClipboardList,
  DoorOpen,
  FileBarChart,
  FileSearch,
  Settings,
  Stethoscope,
  Users,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role";

type NavItem = { href: string; label: string; icon: typeof BarChart3 };

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

export function Sidebar() {
  const pathname = usePathname();
  const { role } = useRole();
  const allowed = new Set(navByRole[role] ?? []);
  const items = navAll.filter((n) => allowed.has(n.href));

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Stethoscope size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">ClinicaShare</p>
          <p className="text-xs text-muted-foreground leading-tight">Gestão de repasses</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.length === 0 && (
          <p className="px-3 py-2 text-xs text-muted-foreground">
            Este perfil usa o portal do paciente, não a área administrativa.
          </p>
        )}
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
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
  );
}
