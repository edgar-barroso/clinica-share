"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar, ChevronRight, Clock, MapPin, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  atendimentos,
  getConsultorio,
  getProfissional,
} from "@/lib/mock/data";
import { formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

const PACIENTE_ID = "pt01";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function MinhasConsultasPage() {
  const [tab, setTab] = useState<"futuras" | "historico">("futuras");

  const todas = atendimentos.filter((a) => a.pacienteId === PACIENTE_ID);
  const futuras = todas
    .filter((a) => a.status === "agendado" || a.status === "confirmado")
    .sort((a, b) => `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`));
  const historico = todas
    .filter((a) => a.status === "realizado" || a.status === "cancelado")
    .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`));

  const lista = tab === "futuras" ? futuras : historico;

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold">Minhas consultas</h1>
        <Link
          href="/p/agendar"
          className={buttonVariants({ size: "sm", className: "h-9 rounded-full px-3" })}
        >
          <Plus size={14} />
          Nova
        </Link>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-full bg-muted p-1 text-sm">
        <button
          type="button"
          onClick={() => setTab("futuras")}
          className={cn(
            "rounded-full py-1.5 font-medium transition-colors",
            tab === "futuras"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Próximas {futuras.length > 0 && `(${futuras.length})`}
        </button>
        <button
          type="button"
          onClick={() => setTab("historico")}
          className={cn(
            "rounded-full py-1.5 font-medium transition-colors",
            tab === "historico"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground",
          )}
        >
          Histórico {historico.length > 0 && `(${historico.length})`}
        </button>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            tab === "futuras"
              ? "Nenhuma consulta agendada"
              : "Nenhuma consulta no histórico"
          }
          description={
            tab === "futuras"
              ? "Agende sua próxima visita com um especialista."
              : "Suas consultas realizadas aparecem aqui."
          }
          action={
            tab === "futuras" ? (
              <Link href="/p/agendar" className={buttonVariants()}>
                <Plus size={14} />
                Agendar
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {lista.map((a) => {
            const prof = getProfissional(a.profissionalId);
            const cons = getConsultorio(a.consultorioId);
            return (
              <Link key={a.id} href={`/p/consultas/${a.id}`} className="block">
                <Card className="transition-colors hover:border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                        {initials(prof?.nome ?? "—")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold">
                            {prof?.nome}
                          </p>
                          <AgendamentoStatusBadge status={a.status} />
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {prof?.especialidade}
                        </p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} /> {formatDateLong(a.data)}
                          </span>
                          <span className="flex items-center gap-1 tabular-nums">
                            <Clock size={12} /> {a.hora}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin size={12} /> {cons?.nome}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <PaymentStatusBadge status={a.statusPagamento} />
                          <ChevronRight size={14} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
