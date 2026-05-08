"use client";

import Link from "next/link";
import { ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";

interface TurnoView {
  id: "manha" | "tarde" | "noite";
  label: string;
  inicio: string;
  fim: string;
}

/**
 * Defaults atuais (PEND-014 — confirmar com Dr. Edson em R2).
 * Estão hardcoded em `app/(back-end)/_lib/turnos.ts` — `horaToTurno()`
 * usa esses limites para classificar atendimentos no cálculo de
 * repasse aluguel-fixo (Fase 5).
 */
const TURNOS_DEFAULT: TurnoView[] = [
  { id: "manha", label: "Manhã", inicio: "07:00", fim: "12:59" },
  { id: "tarde", label: "Tarde", inicio: "13:00", fim: "17:59" },
  { id: "noite", label: "Noite", inicio: "18:00", fim: "19:59" },
];

export default function TurnosPage() {
  return (
    <>
      <Link
        href="/configuracoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para configurações
      </Link>

      <PageHeader
        title="Turnos"
        description="Faixas horárias usadas no cálculo de repasse aluguel-fixo (PEND-014)"
      />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-4 text-xs text-warning">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Configuração via UI virá após R2</p>
          <p className="mt-1">
            Os valores abaixo são os defaults aplicados pelo sistema. Edição
            via interface depende da confirmação dos turnos com Dr. Edson na
            próxima reunião (PEND-014). Por enquanto, qualquer ajuste exige
            mudança em <code className="text-foreground">_lib/turnos.ts</code>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {TURNOS_DEFAULT.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock size={16} className="text-primary" />
                {t.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {t.inicio} – {t.fim}
              </p>
              <Badge variant="outline" className="mt-3 text-xs">
                {t.id}
              </Badge>
              <p className="mt-3 text-xs text-muted-foreground">
                Usado em <code>horaToTurno()</code> para agrupar atendimentos
                no cálculo de repasse aluguel-fixo (Fase 5).
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
