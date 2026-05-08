"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layouts/page-header";
import { AgendaList } from "../agenda/_components/agenda-list";
import {
  apiListAgendamentos,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDateLong } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

export default function MinhaAgendaPage() {
  const { profissionalId, userNome, loading: userLoading } = useCurrentUser();
  const [agendamentos, setAgendamentos] = useState<AgendamentoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!profissionalId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { agendamentos } = await apiListAgendamentos();
      setAgendamentos(
        agendamentos
          .filter((a) => a.status !== "cancelado" && a.status !== "realizado")
          .sort((a, b) =>
            `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`),
          ),
      );
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [profissionalId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const porDia = useMemo(() => {
    return agendamentos.reduce<Record<string, AgendamentoListItem[]>>(
      (acc, a) => {
        (acc[a.data] ??= []).push(a);
        return acc;
      },
      {},
    );
  }, [agendamentos]);
  const dias = Object.keys(porDia).sort();

  if (userLoading) {
    return (
      <>
        <PageHeader
          title="Minha agenda"
          description="Visão do profissional — apenas seus atendimentos"
        />
        <p className="py-8 text-center text-sm text-muted-foreground">
          Carregando…
        </p>
      </>
    );
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
              Sua conta não está vinculada a um profissional. Peça ao admin
              para associar seu usuário ao registro de profissional.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Minha agenda"
        description={`${userNome} · próximos atendimentos`}
      />

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : dias.length === 0 ? (
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
              <AgendaList agendamentos={porDia[data]} onChange={fetchData} />
            </section>
          ))}
        </div>
      )}
    </>
  );
}
