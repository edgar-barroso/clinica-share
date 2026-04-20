"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserPlus } from "lucide-react";
import { pacientes as pacientesSeed } from "@/lib/mock/data";
import { cn } from "@/lib/utils";
import type { Paciente } from "@/lib/mock/types";
import { NovoPacienteDialog } from "./novo-paciente-dialog";

interface Props {
  id?: string;
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}

function onlyDigits(s: string) {
  return s.replace(/\D/g, "");
}

function matches(p: Paciente, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (p.nome.toLowerCase().includes(q)) return true;
  const qDigits = onlyDigits(q);
  if (qDigits && onlyDigits(p.telefone).includes(qDigits)) return true;
  return false;
}

export function PacienteCombobox({ id, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [extras, setExtras] = useState<Paciente[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const todos = useMemo(() => [...extras, ...pacientesSeed], [extras]);
  const selecionado = useMemo(
    () => todos.find((p) => p.id === value) ?? null,
    [todos, value],
  );
  const filtrados = useMemo(
    () => todos.filter((p) => matches(p, query)).slice(0, 10),
    [todos, query],
  );

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  function openDropdown() {
    setOpen(true);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  function toggleDropdown() {
    if (open) setOpen(false);
    else openDropdown();
  }

  function handleCreate(novo: Paciente) {
    setExtras((e) => [novo, ...e]);
    onChange(novo.id);
    setDialogOpen(false);
    setOpen(false);
  }

  const showCreate = query.trim().length > 0 && filtrados.length === 0;

  return (
    <div ref={rootRef} className="relative">
      <input type="hidden" value={value} required={required} readOnly />
      <button
        id={id}
        type="button"
        onClick={toggleDropdown}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-input bg-background px-3 text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <span className={cn("truncate", !selecionado && "text-muted-foreground")}>
          {selecionado
            ? `${selecionado.nome} — ${selecionado.telefone}`
            : "Buscar paciente por nome ou telefone…"}
        </span>
        <ChevronDown size={14} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          <div className="relative border-b border-border">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome ou telefone"
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {filtrados.length === 0 && !showCreate && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum paciente encontrado.
              </li>
            )}
            {filtrados.map((p) => {
              const ativo = p.id === value;
              const isExtra = extras.some((x) => x.id === p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(p.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-start justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted",
                      ativo && "bg-primary/5",
                    )}
                    role="option"
                    aria-selected={ativo}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {p.nome}
                        {isExtra && (
                          <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary">
                            novo
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground tabular-nums">
                        {p.telefone}
                      </p>
                    </div>
                    {ativo && (
                      <Check size={14} className="mt-1 shrink-0 text-primary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border">
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-primary transition-colors hover:bg-primary/5"
            >
              <UserPlus size={14} />
              {showCreate
                ? `Cadastrar novo paciente: "${query.trim()}"`
                : "Cadastrar novo paciente"}
            </button>
          </div>
        </div>
      )}

      <NovoPacienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialQuery={query}
        onCreate={handleCreate}
      />
    </div>
  );
}
