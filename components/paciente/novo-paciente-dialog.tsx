"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Paciente } from "@/lib/mock/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onCreate: (p: Paciente) => void;
}

function looksLikePhone(q: string) {
  const digits = q.replace(/\D/g, "");
  return digits.length >= 8;
}

export function NovoPacienteDialog({
  open,
  onOpenChange,
  initialQuery = "",
  onCreate,
}: Props) {
  if (!open) return null;
  return (
    <NovoPacienteDialogInner
      initialQuery={initialQuery}
      onOpenChange={onOpenChange}
      onCreate={onCreate}
    />
  );
}

function NovoPacienteDialogInner({
  initialQuery,
  onOpenChange,
  onCreate,
}: Omit<Props, "open"> & { initialQuery: string }) {
  const seededWithPhone = looksLikePhone(initialQuery);
  const [nome, setNome] = useState(() => (seededWithPhone ? "" : initialQuery));
  const [telefone, setTelefone] = useState(() =>
    seededWithPhone ? initialQuery : "",
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const novo: Paciente = {
      id: `pt-${Date.now().toString(36)}`,
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: "",
    };
    onCreate(novo);
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
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Cadastrar novo paciente</h2>
              <p className="text-xs text-muted-foreground">
                Dados mínimos. Complete o cadastro no primeiro atendimento.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="novo-paciente-nome">Nome completo</Label>
            <Input
              id="novo-paciente-nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Maria da Silva"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="novo-paciente-telefone">Celular com WhatsApp</Label>
            <Input
              id="novo-paciente-telefone"
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              required
            />
            <p className="text-xs text-muted-foreground">
              Usado para lembretes e confirmações.
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              <UserPlus size={14} />
              Cadastrar e selecionar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
