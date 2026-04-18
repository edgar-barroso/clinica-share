import Link from "next/link";
import { CalendarDays, Clock, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  atendimentos,
  getConsultorio,
  getPaciente,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL } from "@/lib/format";

const DIAS = [
  { data: "2026-04-13", dia: "Seg", num: "13" },
  { data: "2026-04-14", dia: "Ter", num: "14" },
  { data: "2026-04-15", dia: "Qua", num: "15" },
  { data: "2026-04-16", dia: "Qui", num: "16" },
  { data: "2026-04-17", dia: "Sex", num: "17" },
];

export default function AgendaPage() {
  const hoje = "2026-04-13";
  const ats = atendimentos
    .filter((a) => a.data === hoje && a.status !== "cancelado")
    .sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <>
      <PageHeader
        title="Agenda"
        description="Segunda-feira, 13 de abril de 2026 · visão do dia"
        actions={
          <Link href="/agenda/novo" className={buttonVariants()}>
            <Plus size={16} />
            Novo agendamento
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-5 gap-2">
        {DIAS.map((d) => (
          <button
            key={d.data}
            className={`rounded-xl border p-3 text-center transition-colors ${
              d.data === hoje
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <p className="text-xs font-medium uppercase">{d.dia}</p>
            <p className="mt-1 text-xl font-bold tabular-nums">{d.num}</p>
          </button>
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
              a.valorConsulta + a.procedimentos.reduce((s, p) => s + p.valor, 0);
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
                      <CardTitle className="truncate text-base">{paciente?.nome}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {prof?.nome} · {prof?.especialidade}
                      </p>
                      <p className="text-xs text-muted-foreground">{cons?.nome}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <AgendamentoStatusBadge status={a.status} />
                    <PaymentStatusBadge status={a.statusPagamento} />
                    <p className="text-sm font-semibold tabular-nums">{formatBRL(bruto)}</p>
                  </div>
                </CardHeader>
                {a.procedimentos.length > 0 && (
                  <CardContent className="border-t border-border pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Procedimentos previstos
                    </p>
                    <ul className="mt-2 space-y-1">
                      {a.procedimentos.map((p) => (
                        <li key={p.nome} className="flex justify-between text-sm">
                          <span>{p.nome}</span>
                          <span className="tabular-nums">{formatBRL(p.valor)}</span>
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
