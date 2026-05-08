import { Badge } from "@/components/ui/badge";
import type { StatusAgendamento, StatusPagamento, StatusRepasse } from "@/lib/mock/types";

export function PaymentStatusBadge({ status }: { status: StatusPagamento }) {
  const map = {
    pago: { variant: "success" as const, label: "Pago" },
    pendente: { variant: "warning" as const, label: "Pendente" },
    gratuito: { variant: "secondary" as const, label: "Gratuito" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function RepasseStatusBadge({
  status,
  atrasado = false,
}: {
  status: StatusRepasse;
  atrasado?: boolean;
}) {
  if (atrasado && status === "aberto") {
    return <Badge variant="danger">Atrasado</Badge>;
  }
  const map = {
    aberto: { variant: "warning" as const, label: "Em aberto" },
    pago: { variant: "success" as const, label: "Pago" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function AgendamentoStatusBadge({ status }: { status: StatusAgendamento }) {
  const map: Record<StatusAgendamento, { variant: "success" | "warning" | "danger" | "secondary" | "info" | "default"; label: string }> = {
    agendado: { variant: "info", label: "Agendado" },
    em_atendimento: { variant: "warning", label: "Em atendimento" },
    realizado: { variant: "success", label: "Realizado" },
    cancelado: { variant: "danger", label: "Cancelado" },
    nao_compareceu: { variant: "secondary", label: "Não compareceu" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}
