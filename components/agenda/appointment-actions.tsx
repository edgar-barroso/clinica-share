"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { nextActions } from "@/lib/appointment-transitions";
import type { Atendimento, StatusAgendamento } from "@/lib/mock/types";
import type { Role } from "@/lib/role";

interface Props {
  atendimento: Atendimento;
  role: Role;
  onTransition: (to: StatusAgendamento) => void;
}

export function AppointmentActions({ atendimento, role, onTransition }: Props) {
  const router = useRouter();
  const actions = nextActions(atendimento.status, role);

  if (actions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant={action.variant}
            onClick={() => {
              if (action.to === "finalize") {
                router.push(`/atendimentos/novo?from=${atendimento.id}`);
                return;
              }
              onTransition(action.to);
            }}
          >
            <Icon size={14} />
            {action.label}
          </Button>
        );
      })}
    </div>
  );
}
