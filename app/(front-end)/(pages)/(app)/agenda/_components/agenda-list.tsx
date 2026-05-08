"use client";

import { useState } from "react";
import { Clock, MapPin, Stethoscope, User } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AgendamentoStatusBadge } from "@/components/financial/status-badge";
import {
  apiCancelarAgendamento,
  apiMarcarChegada,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";

interface Props {
  agendamentos: AgendamentoListItem[];
  onChange: () => void;
  showProfissional?: boolean;
}

export function AgendaList({ agendamentos, onChange, showProfissional }: Props) {
  const { role } = useCurrentUser();
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  // RBAC client-side: define quais ações aparecem para cada role.
  const podeMarcarChegada = ["admin", "auxiliar", "atendente"].includes(role);
  const podeCancelar = ["admin", "auxiliar", "atendente"].includes(role);

  async function handleMarcarChegada(id: string) {
    try {
      await apiMarcarChegada(id);
      toast.success("Chegada registrada");
      onChange();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCancelar(id: string) {
    if (motivo.trim().length < 3) {
      toast.warning("Motivo é obrigatório (mínimo 3 caracteres)");
      return;
    }
    try {
      await apiCancelarAgendamento(id, motivo.trim());
      toast.success("Agendamento cancelado");
      setCancelandoId(null);
      setMotivo("");
      onChange();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-3">
      {agendamentos.map((a) => (
        <Card key={a.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock size={14} className="text-muted-foreground" />
                {a.hora}
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <User size={14} className="text-muted-foreground" />
                <span className="font-medium">{a.paciente.nome}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  · {a.paciente.telefone}
                </span>
              </div>
              {showProfissional && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Stethoscope size={14} />
                  {a.profissional.nome} · {a.profissional.especialidade}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin size={14} />
                {a.consultorio.nome}
              </div>
              <AgendamentoStatusBadge status={a.status} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {a.status === "agendado" && podeMarcarChegada && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarcarChegada(a.id)}
                >
                  Marcar chegada
                </Button>
              )}
              {(a.status === "agendado" || a.status === "em_atendimento") &&
                podeCancelar && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setCancelandoId(a.id);
                      setMotivo("");
                    }}
                  >
                    Cancelar
                  </Button>
                )}
            </div>

            {cancelandoId === a.id && (
              <div className="basis-full border-t border-border pt-3 sm:basis-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label htmlFor={`motivo-${a.id}`}>Motivo do cancelamento</Label>
                    <Input
                      id={`motivo-${a.id}`}
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder="Ex: Paciente solicitou remarcação"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setCancelandoId(null);
                        setMotivo("");
                      }}
                    >
                      Voltar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => handleCancelar(a.id)}
                    >
                      Confirmar cancelamento
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
