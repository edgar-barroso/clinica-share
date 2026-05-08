"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/select";
import {
  nextActions,
  type AppointmentAction,
} from "@/lib/appointment-transitions";
import type { Atendimento, StatusAgendamento } from "@/lib/mock/types";
import type { Role } from "@/lib/role";

interface Props {
  atendimento: Atendimento;
  role: Role;
  onTransition: (to: StatusAgendamento, motivo?: string) => void;
}

export function AppointmentActions({ atendimento, role, onTransition }: Props) {
  const router = useRouter();
  const actions = nextActions(atendimento.status, role);
  const [pendingMotivo, setPendingMotivo] = useState<AppointmentAction | null>(
    null,
  );

  if (actions.length === 0) return null;

  function handleClick(action: AppointmentAction) {
    if (action.to === "finalize") {
      router.push(`/atendimentos/novo?from=${atendimento.id}`);
      return;
    }
    if (action.requiresMotivo) {
      setPendingMotivo(action);
      return;
    }
    onTransition(action.to as StatusAgendamento);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant={action.variant}
              onClick={() => handleClick(action)}
            >
              <Icon size={14} />
              {action.label}
            </Button>
          );
        })}
      </div>

      {pendingMotivo && (
        <MotivoDialog
          action={pendingMotivo}
          onClose={() => setPendingMotivo(null)}
          onConfirm={(motivo) => {
            const action = pendingMotivo;
            setPendingMotivo(null);
            onTransition(action.to as StatusAgendamento, motivo);
          }}
        />
      )}
    </>
  );
}

interface MotivoDialogProps {
  action: AppointmentAction;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
}

function MotivoDialog({ action, onClose, onConfirm }: MotivoDialogProps) {
  const [motivo, setMotivo] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!motivo.trim()) return;
    onConfirm(motivo.trim());
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">{action.label} agendamento</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Registre o motivo (AG06) — fica visível na auditoria.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="motivo-cancelamento">Motivo *</Label>
            <Textarea
              id="motivo-cancelamento"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex: Paciente solicitou remarcação por motivo pessoal"
              rows={3}
              required
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              variant="destructive"
              className="flex-1"
              disabled={!motivo.trim()}
            >
              Confirmar {action.label.toLowerCase()}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
