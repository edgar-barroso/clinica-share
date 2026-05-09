"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { ArrowLeft, Clock, Pencil, ShieldAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetTurnos,
  apiUpdateTurnos,
  type TurnosConfig,
} from "@/lib/api/configuracoes";
import { apiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";

type TurnoId = keyof TurnosConfig;
const TURNO_LABEL: Record<TurnoId, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export default function TurnosPage() {
  const { role } = useCurrentUser();
  const podeEditar = role === "admin";

  const [turnos, setTurnos] = useState<TurnosConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<TurnoId | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { turnos } = await apiGetTurnos();
      setTurnos(turnos);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function salvar(id: TurnoId, inicio: string, fim: string) {
    if (!turnos) return;
    const novo = { ...turnos, [id]: { inicio, fim } };
    try {
      const { turnos: updated } = await apiUpdateTurnos(novo);
      setTurnos(updated);
      setEditingId(null);
      toast.success(`${TURNO_LABEL[id]} atualizado`, {
        description: "Audit log gravado (RNF-102).",
      });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading || !turnos) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando…
      </p>
    );
  }

  const editingTurno = editingId ? turnos[editingId] : null;

  return (
    <>
      <Link
        href="/configuracoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para configurações
      </Link>

      <PageHeader
        title="Turnos"
        description="Faixas horárias usadas no cálculo de repasse aluguel-fixo (PEND-014)"
      />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-4 text-xs text-warning">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Mudança auditada</p>
          <p className="mt-1">
            Os horários abaixo são persistidos e usados no agrupamento de
            atendimentos por turno. Toda edição fica registrada em AuditLog.
            Os defaults vêm de PEND-014 (manhã 7-13, tarde 13-18, noite
            18-20) — confirmar com Dr. Edson em R2.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(Object.keys(turnos) as TurnoId[]).map((id) => {
          const t = turnos[id];
          return (
            <Card key={id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock size={16} className="text-primary" />
                  {TURNO_LABEL[id]}
                </CardTitle>
                {podeEditar && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingId(id)}
                  >
                    <Pencil size={14} />
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold tabular-nums">
                  {t.inicio} – {t.fim}
                </p>
                <Badge variant="outline" className="mt-3 text-xs">
                  {id}
                </Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingId && editingTurno && (
        <EditarTurnoDialog
          id={editingId}
          inicio={editingTurno.inicio}
          fim={editingTurno.fim}
          onClose={() => setEditingId(null)}
          onSave={(inicio, fim) => salvar(editingId, inicio, fim)}
        />
      )}
    </>
  );
}

function EditarTurnoDialog({
  id,
  inicio: inicioInicial,
  fim: fimInicial,
  onClose,
  onSave,
}: {
  id: TurnoId;
  inicio: string;
  fim: string;
  onClose: () => void;
  onSave: (inicio: string, fim: string) => void;
}) {
  const [inicio, setInicio] = useState(inicioInicial);
  const [fim, setFim] = useState(fimInicial);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (fim <= inicio) {
      toast.warning("Fim deve ser maior que início");
      return;
    }
    onSave(inicio, fim);
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
            <h2 className="text-base font-semibold">
              Editar turno {TURNO_LABEL[id]}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              A alteração afeta o cálculo de repasse aluguel-fixo a partir
              de agora.
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inicio">Início</Label>
              <Input
                id="inicio"
                type="time"
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fim">Fim</Label>
              <Input
                id="fim"
                type="time"
                value={fim}
                onChange={(e) => setFim(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
