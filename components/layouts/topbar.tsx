"use client";

import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RoleSwitcher } from "./role-switcher";
import { useRole } from "@/lib/role";

export function Topbar() {
  const { info } = useRole();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-10">
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

      <RoleSwitcher />

      <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
        <Bell size={18} />
        <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-destructive" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold leading-tight">{info.name}</p>
          <p className="text-xs text-muted-foreground leading-tight">{info.label}</p>
        </div>
        <Avatar>
          <AvatarFallback>{info.initials}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
