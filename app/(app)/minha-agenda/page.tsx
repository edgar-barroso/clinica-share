"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Clock, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
} from "@/lib/mock/data";
import { formatBRL, formatDateLong } from "@/lib/format";
import { toastMessage } from "@/lib/appointment-transitions";
import { useCurrentUser } from "@/lib/current-user";
import type {
  Atendimento,
  StatusAgendamento,
} from "@/lib/mock/types";

export default function MinhaAgendaPage() {
  const { role, profissionalId, userNome } = useCurrentUser();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(
    atendimentosSeed,
  );

  const meusAtendimentos = useMemo(() => {
    if (!profissionalId) return [];
    return atendimentos
      .filter((a) => a.profissionalId === profissionalId)
      .filter((a) => a.status !== "cancelado" && a.status !== "realizado")
      .sort((a, b) => `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`));
  }, [atendimentos, profissionalId]);

  function handleTransition(id: string, to: StatusAgendamento) {
    setAtendimentos((list) =>
      list.map((a) => (a.id === id ? { ...a, status: to } : a)),
    );
    toast.success(toastMessage(to), {
      description: `Registrado por ${userNome}`,
    });
  }

  if (!profissionalId) {
    return (
      <>
        <PageHeader
          title="Minha agenda"
          description="Visão do profissional — apenas seus atendimentos"
        />
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-warning/15 text-warning">
              <ShieldAlert size={20} />
            </div>
            <p className="text-base font-semibold">
              Esta tela é exclusiva do profissional
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Troque o papel para &quot;Profissional&quot; no seletor do topo
              para ver apenas os atendimentos da Dra. Nirmala Azalea.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  const porDia = meusAtendimentos.reduce<Record<string, Atendimento[]>>(
    (acc, a) => {
      (acc[a.data] ??= []).push(a);
      return acc;
    },
    {},
  );
  const dias = Object.keys(porDia).sort();

  return (
    <>
      <PageHeader
        title="Minha agenda"
        description={`${userNome} · próximos atendimentos`}
      />

      <div className="mb-6 flex items-center gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-3 text-xs text-warning">
        <ShieldAlert size={14} />
        <span>
          Protótipo · ações refletem nesta tela mas não persistem entre
          navegações
        </span>
      </div>

      {dias.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum atendimento pendente"
          description="Você não tem consultas agendadas ou em andamento no momento."
        />
      ) : (
        <div className="space-y-8">
          {dias.map((data) => (
            <section key={data}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                {formatDateLong(data)}
              </h2>
              <div className="space-y-3">
                {porDia[data].map((a) => {
                  const paciente = getPaciente(a.pacienteId);
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
                            <p className="mt-1 text-xs text-muted-foreground">
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
                      <CardContent className="flex items-center justify-between gap-3 border-t border-border pt-4">
                        <Link
                          href={`/atendimentos/${a.id}`}
                          className={buttonVariants({
                            variant: "ghost",
                            size: "sm",
                          })}
                        >
                          Ver detalhes
                        </Link>
                        <AppointmentActions
                          atendimento={a}
                          role={role}
                          onTransition={(to) => handleTransition(a.id, to)}
                        />
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
