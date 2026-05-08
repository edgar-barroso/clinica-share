"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarDays, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layouts/page-header";
import { AgendaList } from "./_components/agenda-list";
import {
  apiListAgendamentos,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDate, formatDateLong } from "@/lib/format";

function buildDiasSemana(): { data: string; dia: string; num: string }[] {
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
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;
    const abbr = formatDate(d, "EEE").replace(/\.$/, "");
    return {
      data: iso,
      dia: abbr.charAt(0).toUpperCase() + abbr.slice(1),
      num: String(d.getDate()).padStart(2, "0"),
    };
  });
}

export default function AgendaPage() {
  const DIAS = useMemo(() => buildDiasSemana(), []);
  const hojeIso = useMemo(() => {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    const yyyy = h.getFullYear();
    const mm = String(h.getMonth() + 1).padStart(2, "0");
    const dd = String(h.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const [diaSelecionado, setDiaSelecionado] = useState(
    () => DIAS.find((d) => d.data === hojeIso)?.data ?? DIAS[0].data,
  );
  const [agendamentos, setAgendamentos] = useState<AgendamentoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { agendamentos } = await apiListAgendamentos({ data: diaSelecionado });
      setAgendamentos(
        agendamentos
          .filter((a) => a.status !== "cancelado")
          .sort((a, b) => a.hora.localeCompare(b.hora)),
      );
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [diaSelecionado]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

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

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
      ) : agendamentos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum atendimento neste dia"
          description="Aproveite para revisar prontuários ou ajustar a agenda."
        />
      ) : (
        <AgendaList
          agendamentos={agendamentos}
          onChange={fetchData}
          showProfissional
        />
      )}
    </>
  );
}
