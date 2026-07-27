"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Settings, ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import { AgendaList } from "../agenda/_components/agenda-list";
import {
  agendamentoEmAberto,
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
        // A tela é a fila de trabalho do profissional: atendimento concluído,
        // paciente que faltou e cancelamento saem dela.
        agendamentos
          .filter(agendamentoEmAberto)
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
        <MinhaAgendaSkeleton />
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
        actions={
          <Link
            href={`/profissionais/${profissionalId}/editar`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Settings size={14} />
            Meu perfil
          </Link>
        }
      />

      {loading ? (
        <MinhaAgendaSkeleton />
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

function MinhaAgendaSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      {Array.from({ length: 2 }).map((_, day) => (
        <section key={day}>
          <Skeleton className="mb-3 h-4 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-start justify-between gap-3 p-5">
                  <div className="flex items-start gap-4">
                    <Skeleton className="size-14 rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-44" />
                      <Skeleton className="h-3 w-56" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="flex justify-end gap-2 border-t border-border pt-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
