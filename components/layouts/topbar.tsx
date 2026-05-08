"use client";

import { LogOut, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileSidebarTrigger } from "./mobile-sidebar";
import { useRole } from "@/lib/role";
import { cn } from "@/lib/utils";

export function Topbar() {
  const { role, info } = useRole();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  function handleLogout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("clinicashare:role");
    }
    setMenuOpen(false);
    toast.success("Sessão encerrada");
    router.push(role === "paciente" ? "/entrar" : "/login");
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-10">
      <MobileSidebarTrigger />
      <div className="relative hidden max-w-md flex-1 md:block">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <input
          type="search"
          placeholder="Buscar paciente, profissional, atendimento…"
          className="h-9 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex-1 md:hidden" />

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu do usuário"
          aria-expanded={menuOpen}
          className="flex items-center gap-2 rounded-xl px-1 py-1 transition-colors hover:bg-muted"
        >
          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold leading-tight">{info.name}</p>
            <p className="text-xs text-muted-foreground leading-tight">{info.label}</p>
          </div>
          <Avatar>
            <AvatarFallback>{info.initials}</AvatarFallback>
          </Avatar>
        </button>

        {menuOpen && (
          <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-card shadow-lg">
            <div className="border-b border-border px-3 py-2">
              <p className="truncate text-sm font-semibold">{info.name}</p>
              <p className="truncate text-xs text-muted-foreground">{info.label}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10",
              )}
            >
              <LogOut size={14} />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
