"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PeriodoSelector,
  type PeriodoSelectorValue,
} from "@/components/relatorios/periodo-selector";
import {
  consultorios,
  formatPeriodoLabel,
  receitaPorConsultorio,
  semanaAtual,
} from "@/lib/mock/data";
import { formatBRL } from "@/lib/format";

export function TopConsultoriosCard() {
  const [seletor, setSeletor] = useState<PeriodoSelectorValue>(() => ({
    tipo: "semana",
    periodo: semanaAtual(),
  }));

  const ranking = useMemo(
    () => receitaPorConsultorio(seletor.periodo).slice(0, 3),
    [seletor.periodo],
  );
  const label = formatPeriodoLabel(seletor.periodo, seletor.tipo);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top consultórios</CardTitle>
        <CardDescription>Ranking por receita · {label}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <PeriodoSelector value={seletor} onChange={setSeletor} />
        {ranking.map((r, idx) => {
          const c = consultorios.find((cc) => cc.id === r.consultorioId)!;
          return (
            <div key={c.id} className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                #{idx + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {c.especialidadesCompativeis[0]} · {r.atendimentos} atend.
                </p>
              </div>
              <p className="text-sm font-semibold tabular-nums">
                {formatBRL(r.receita)}
              </p>
            </div>
          );
        })}
        <Link
          href="/consultorios"
          className="text-xs font-medium text-primary hover:underline"
        >
          Ver todos os consultórios →
        </Link>
      </CardContent>
    </Card>
  );
}
