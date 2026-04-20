import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Play,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import type { Role } from "@/lib/role";
import type { StatusAgendamento } from "@/lib/mock/types";

export interface AppointmentAction {
  id: string;
  label: string;
  icon: LucideIcon;
  to: StatusAgendamento | "finalize";
  variant: "default" | "outline" | "ghost" | "destructive";
  requiresMotivo?: boolean;
}

const ALL_ACTIONS: Record<string, AppointmentAction> = {
  chegou: {
    id: "chegou",
    label: "Chegou",
    icon: UserCheck,
    to: "em_atendimento",
    variant: "default",
  },
  iniciar: {
    id: "iniciar",
    label: "Iniciar atendimento",
    icon: Play,
    to: "em_atendimento",
    variant: "default",
  },
  finalizar: {
    id: "finalizar",
    label: "Finalizar e registrar",
    icon: CheckCircle2,
    to: "finalize",
    variant: "default",
  },
  nao_compareceu: {
    id: "nao_compareceu",
    label: "Não compareceu",
    icon: UserX,
    to: "nao_compareceu",
    variant: "outline",
    requiresMotivo: false,
  },
  cancelar: {
    id: "cancelar",
    label: "Cancelar",
    icon: XCircle,
    to: "cancelado",
    variant: "ghost",
    requiresMotivo: true,
  },
};

const ROLE_ACTIONS: Record<
  Role,
  Partial<Record<StatusAgendamento, string[]>>
> = {
  admin: {
    agendado: ["chegou", "nao_compareceu", "cancelar"],
    em_atendimento: ["finalizar", "cancelar"],
  },
  atendente: {
    agendado: ["chegou", "nao_compareceu", "cancelar"],
    em_atendimento: ["cancelar"],
  },
  profissional: {
    agendado: ["iniciar"],
    em_atendimento: ["finalizar"],
  },
  auxiliar: {},
  paciente: {},
};

export function nextActions(
  status: StatusAgendamento,
  role: Role,
): AppointmentAction[] {
  const actionIds = ROLE_ACTIONS[role][status] ?? [];
  return actionIds.map((id) => ALL_ACTIONS[id]).filter(Boolean);
}

export function canTransition(
  from: StatusAgendamento,
  to: StatusAgendamento,
  role: Role,
): boolean {
  const actionIds = ROLE_ACTIONS[role][from] ?? [];
  return actionIds.some((id) => {
    const action = ALL_ACTIONS[id];
    return action && action.to === to;
  });
}

const LABELS: Record<StatusAgendamento, string> = {
  agendado: "Agendado",
  em_atendimento: "Em atendimento",
  realizado: "Realizado",
  cancelado: "Cancelado",
  nao_compareceu: "Não compareceu",
};

export function labelOf(status: StatusAgendamento): string {
  return LABELS[status];
}

export function toastMessage(to: StatusAgendamento | "finalize"): string {
  switch (to) {
    case "em_atendimento":
      return "Paciente em atendimento";
    case "realizado":
      return "Atendimento finalizado";
    case "cancelado":
      return "Agendamento cancelado";
    case "nao_compareceu":
      return "Marcado como não compareceu";
    case "finalize":
      return "Abrindo registro do atendimento…";
    case "agendado":
      return "Status revertido para agendado";
  }
}
