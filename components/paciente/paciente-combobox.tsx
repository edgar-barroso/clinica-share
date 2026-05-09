"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiListPacientes, type Paciente } from "@/lib/api/pacientes";
import { apiErrorMessage } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { NovoPacienteDialog } from "./novo-paciente-dialog";

interface Props {
  id?: string;
  value: string;
  onChange: (id: string) => void;
  required?: boolean;
}

export function PacienteCombobox({ id, value, onChange, required }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selecionado = useMemo(
    () => pacientes.find((p) => p.id === value) ?? null,
    [pacientes, value],
  );

  // Carga inicial
  useEffect(() => {
    setLoading(true);
    apiListPacientes()
      .then((res) => setPacientes(res.pacientes))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  // Debounce de busca server-side
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setLoading(true);
      apiListPacientes({ q: query })
        .then((res) => setPacientes(res.pacientes))
        .catch((err) => toast.error(apiErrorMessage(err)))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [query, open]);

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
    setPacientes((arr) => [novo, ...arr]);
    onChange(novo.id);
    setDialogOpen(false);
    setOpen(false);
  }

  const showCreate = query.trim().length > 0 && pacientes.length === 0 && !loading;

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
            : "Buscar paciente por nome, e-mail, CPF ou telefone…"}
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
              placeholder="Nome, e-mail, CPF ou telefone"
              className="h-10 w-full bg-transparent pl-9 pr-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>

          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {loading && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Buscando...
              </li>
            )}
            {!loading && pacientes.length === 0 && !showCreate && (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Nenhum paciente encontrado.
              </li>
            )}
            {pacientes.map((p) => {
              const ativo = p.id === value;
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
                      <p className="truncate text-sm font-medium">{p.nome}</p>
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
