"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { CalendarDays, Home, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/p", label: "Início", icon: Home },
  { href: "/p/consultas", label: "Consultas", icon: CalendarDays },
  { href: "/p/perfil", label: "Perfil", icon: User },
];

export function PatientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-border bg-card">
      <div className="relative grid grid-cols-5">
        <NavItem
          href="/p"
          icon={Home}
          label="Início"
          active={pathname === "/p"}
        />
        <NavItem
          href="/p/consultas"
          icon={CalendarDays}
          label="Consultas"
          active={pathname.startsWith("/p/consultas")}
        />

        <div className="flex items-center justify-center">
          <Link
            href="/p/agendar"
            aria-label="Agendar nova consulta"
            className="-mt-6 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform active:scale-95"
          >
            <Plus size={24} />
          </Link>
        </div>

        <NavItem
          href="/p/perfil"
          icon={User}
          label="Perfil"
          active={pathname.startsWith("/p/perfil")}
        />
        <div className="flex items-center justify-center">
          <span className="block text-[10px] text-muted-foreground select-none">
            Você
          </span>
        </div>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-0.5 py-3 text-xs"
    >
      <Icon
        size={20}
        className={cn(active ? "text-primary" : "text-muted-foreground")}
      />
      <span
        className={cn(
          "text-[11px]",
          active ? "font-semibold text-primary" : "text-muted-foreground",
        )}
      >
        {label}
      </span>
    </Link>
  );
}
