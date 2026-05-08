"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowLeft, Clock, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layouts/page-header";

interface Turno {
  id: string;
  label: string;
  inicio: string;
  fim: string;
  usos: number;
}

const TURNOS_INICIAIS: Turno[] = [
  { id: "manha", label: "Manhã", inicio: "07:00", fim: "12:00", usos: 4 },
  { id: "tarde", label: "Tarde", inicio: "13:00", fim: "18:00", usos: 5 },
  { id: "noite", label: "Noite", inicio: "18:00", fim: "20:00", usos: 2 },
];

export default function TurnosPage() {
  const [turnos, setTurnos] = useState<Turno[]>(TURNOS_INICIAIS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingTurno = useMemo(
    () => turnos.find((t) => t.id === editingId) ?? null,
    [turnos, editingId],
  );

  function salvar(id: string, inicio: string, fim: string) {
    setTurnos((list) =>
      list.map((t) => (t.id === id ? { ...t, inicio, fim } : t)),
    );
    setEditingId(null);
    toast.success("Turno atualizado", {
      description: "Protótipo · alteração não persistida entre sessões.",
    });
  }

  return (
    <>
      <Link
        href="/configuracoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Configurações
      </Link>

      <PageHeader
        title="Turnos da clínica"
        description="Blocos fixos de horário utilizados na alocação de profissionais (AG03) e no cálculo de aluguel por turno (FI08)"
      />

      <Card className="mb-6 border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertTriangle size={18} className="mt-0.5 text-warning" />
          <div className="text-sm">
            <p className="font-semibold">Valores provisórios — PEND-014</p>
            <p className="mt-1 text-muted-foreground">
              Os horários exatos dos turnos ainda serão confirmados com o Dr. Edson
              na Reunião R2. A clínica funciona das 7h às 19h/20h (ata R1 §1.1), mas
              os blocos exatos não foram definidos.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {turnos.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock size={20} />
                </div>
                <Badge variant="secondary">{t.usos} alocações</Badge>
              </div>
              <CardTitle className="mt-2 capitalize">{t.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold tabular-nums">
                {t.inicio} – {t.fim}
              </p>
              <button
                type="button"
                onClick={() => setEditingId(t.id)}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Pencil size={12} />
                Editar horário
              </button>
            </CardContent>
          </Card>
        ))}
      </div>

      {editingTurno && (
        <EditTurnoDialog
          turno={editingTurno}
          onClose={() => setEditingId(null)}
          onSave={salvar}
        />
      )}
    </>
  );
}

interface EditTurnoDialogProps {
  turno: Turno;
  onClose: () => void;
  onSave: (id: string, inicio: string, fim: string) => void;
}

function EditTurnoDialog({ turno, onClose, onSave }: EditTurnoDialogProps) {
  const [inicio, setInicio] = useState(turno.inicio);
  const [fim, setFim] = useState(turno.fim);

  const intervaloInvalido = inicio >= fim;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (intervaloInvalido) {
      toast.error("O horário de fim deve ser maior que o de início.");
      return;
    }
    onSave(turno.id, inicio, fim);
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
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold capitalize">
                Editar turno · {turno.label}
              </h2>
              <p className="text-xs text-muted-foreground">
                Ajuste o intervalo de horário deste bloco.
              </p>
            </div>
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

          {intervaloInvalido && (
            <p className="text-xs text-destructive">
              O horário de fim deve ser maior que o de início.
            </p>
          )}

          <p className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
            {turno.usos} profissionais já estão alocados neste turno. Alterações
            geram novo registro em /auditoria.
          </p>

          <div className="flex gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={intervaloInvalido}
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
