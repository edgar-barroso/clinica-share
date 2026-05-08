"use client";

import { ChevronDown, UserCog } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ROLES, useRole, type Role } from "@/lib/role";
import { cn } from "@/lib/utils";

/**
 * Switcher de perfil — **dev-only** (DEC-P09). Em produção, role vem
 * exclusivamente de `/api/auth/me` (cookie + JWT); permitir trocar via
 * UI seria bypass de RBAC.
 */
export function RoleSwitcher() {
  const { role, info, setRole } = useRole();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  if (process.env.NODE_ENV === "production") {
    return null;
  }

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-sm text-foreground hover:bg-muted transition-colors",
        )}
        aria-label="Trocar perfil simulado"
      >
        <UserCog size={14} className="text-muted-foreground" />
        <span className="hidden sm:inline text-xs font-medium">
          Perfil: <span className="text-foreground">{info.label}</span>
        </span>
        <span className="sm:hidden text-xs font-medium">{info.label}</span>
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-3 py-2">
            <p className="text-xs font-semibold text-foreground">Simular perfil</p>
            <p className="text-xs text-muted-foreground">Só afeta a visualização do protótipo</p>
          </div>
          <ul className="py-1">
            {(Object.keys(ROLES) as Role[]).map((r) => {
              const item = ROLES[r];
              const active = r === role;
              return (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      active && "bg-primary/5",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                    </div>
                    {active && <Badge variant="default">Ativo</Badge>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
