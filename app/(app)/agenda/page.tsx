"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, Plus, ShieldAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import { AppointmentActions } from "@/components/agenda/appointment-actions";
import {
  atendimentos as atendimentosSeed,
  getConsultorio,
  getPaciente,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";
import { toastMessage } from "@/lib/appointment-transitions";
import { useCurrentUser } from "@/lib/current-user";
import type { Atendimento, StatusAgendamento } from "@/lib/mock/types";

function buildDiasSemana() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dow = hoje.getDay();
  const start = new Date(hoje);
  if (dow === 0) start.setDate(hoje.getDate() + 1);
  else if (dow === 6) start.setDate(hoje.getDate() + 2);
  else start.setDate(hoje.getDate() - (dow - 1));

  return Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const abbr = formatDate(d, "EEE").replace(/\.$/, "");
    return {
      data: iso,
      dia: abbr.charAt(0).toUpperCase() + abbr.slice(1),
      num: String(d.getDate()).padStart(2, "0"),
    };
  });
}

export default function AgendaPage() {
  const { role, userNome } = useCurrentUser();
  const DIAS = useMemo(() => buildDiasSemana(), []);
  const hojeIso = useMemo(() => {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    return h.toISOString().slice(0, 10);
  }, []);
  const [atendimentos, setAtendimentos] =
    useState<Atendimento[]>(atendimentosSeed);
  const [diaSelecionado, setDiaSelecionado] = useState(
    () => DIAS.find((d) => d.data === hojeIso)?.data ?? DIAS[0].data,
  );

  const ats = atendimentos
    .filter((a) => a.data === diaSelecionado && a.status !== "cancelado")
    .sort((a, b) => a.hora.localeCompare(b.hora));

  function handleTransition(id: string, to: StatusAgendamento) {
    setAtendimentos((list) =>
      list.map((a) => (a.id === id ? { ...a, status: to } : a)),
    );
    toast.success(toastMessage(to), {
      description: `Registrado por ${userNome}`,
    });
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description={`${formatDateLong(diaSelecionado)} · visão do dia`}
        actions={
          <Link href="/agenda/novo" className={buttonVariants()}>
            <Plus size={16} />
            Novo agendamento
          </Link>
        }
      />

      <div className="mb-4 flex items-center gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-3 text-xs text-warning">
        <ShieldAlert size={14} />
        <span>
          Protótipo · ações refletem nesta tela mas não persistem entre
          navegações
        </span>
      </div>

      <div className="mb-6 grid grid-cols-5 gap-2">
        {DIAS.map((d) => (
          <Button
            key={d.data}
            type="button"
            variant="ghost"
            onClick={() => setDiaSelecionado(d.data)}
            className={`h-auto flex-col gap-1 rounded-xl border p-3 ${
              d.data === diaSelecionado
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <span className="text-xs font-medium uppercase">{d.dia}</span>
            <span className="text-xl font-bold tabular-nums">{d.num}</span>
          </Button>
        ))}
      </div>

      {ats.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum atendimento neste dia"
          description="Aproveite para revisar prontuários ou ajustar a agenda."
        />
      ) : (
        <div className="space-y-3">
          {ats.map((a) => {
            const paciente = getPaciente(a.pacienteId);
            const prof = getProfissional(a.profissionalId);
            const cons = getConsultorio(a.consultorioId);
            const bruto =
              a.valorConsulta +
              a.procedimentos.reduce((s, p) => s + p.valor, 0);
            return (
              <Card key={a.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Clock size={14} />
                      <span className="mt-0.5 text-sm font-bold tabular-nums">
                        {a.hora}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {paciente?.nome}
                      </CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {prof?.nome} · {prof?.especialidade}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {cons?.nome}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AgendamentoStatusBadge status={a.status} />
                    <PaymentStatusBadge status={a.statusPagamento} />
                    <p className="text-sm font-semibold tabular-nums">
                      {formatBRL(bruto)}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                  <Link
                    href={`/atendimentos/${a.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Ver detalhes
                  </Link>
                  <AppointmentActions
                    atendimento={a}
                    role={role}
                    onTransition={(to) => handleTransition(a.id, to)}
                  />
                </CardContent>
                {a.procedimentos.length > 0 && (
                  <CardContent className="border-t border-border pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Procedimentos previstos
                    </p>
                    <ul className="mt-2 space-y-1">
                      {a.procedimentos.map((p) => (
                        <li
                          key={p.nome}
                          className="flex justify-between text-sm"
                        >
                          <span>{p.nome}</span>
                          <span className="tabular-nums">
                            {formatBRL(p.valor)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
