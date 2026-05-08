"use client";

import { useMemo, useState } from "react";
import { Calendar, DoorOpen, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReceitaChart } from "@/components/dashboard/receita-chart";
import {
  PeriodoSelector,
  type PeriodoSelectorValue,
} from "@/components/relatorios/periodo-selector";
import {
  atendimentosRealizadosNoIntervalo,
  formatPeriodoLabel,
  receitaPorConsultorio,
  semanaAtual,
  semanasDoMes,
} from "@/lib/mock/data";
import { formatBRL, formatDate } from "@/lib/format";

function diasDoIntervalo(inicio: string, fim: string): string[] {
  const dias: string[] = [];
  const start = new Date(inicio);
  const end = new Date(fim);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dias.push(`${yyyy}-${mm}-${dd}`);
  }
  return dias;
}

interface Props {
  consultorioId: string;
}

export function ConsultorioMetrics({ consultorioId }: Props) {
  const [seletor, setSeletor] = useState<PeriodoSelectorValue>(() => ({
    tipo: "semana",
    periodo: semanaAtual(),
  }));

  const ranking = useMemo(
    () => receitaPorConsultorio(seletor.periodo),
    [seletor.periodo],
  );
  const r = ranking.find((x) => x.consultorioId === consultorioId);
  const posicao = ranking.findIndex((x) => x.consultorioId === consultorioId) + 1;
  const ativos = ranking.filter((x) => x.atendimentos > 0).length;

  const chartData = useMemo(() => {
    if (seletor.tipo === "semana") {
      return diasDoIntervalo(seletor.periodo.inicio, seletor.periodo.fim).map(
        (iso) => {
          const total = atendimentosRealizadosNoIntervalo({ inicio: iso, fim: iso })
            .filter(
              (a) =>
                a.consultorioId === consultorioId &&
                a.statusPagamento === "pago",
            )
            .reduce(
              (s, a) =>
                s +
                a.valorConsulta +
                a.procedimentos.reduce((ss, p) => ss + p.valor, 0),
              0,
            );
          return { dia: formatDate(iso, "dd/MM"), receita: total };
        },
      );
    }
    return semanasDoMes(seletor.periodo).map((sem, idx) => {
      const total = atendimentosRealizadosNoIntervalo(sem)
        .filter(
          (a) =>
            a.consultorioId === consultorioId && a.statusPagamento === "pago",
        )
        .reduce(
          (s, a) =>
            s + a.valorConsulta + a.procedimentos.reduce((ss, p) => ss + p.valor, 0),
          0,
        );
      return { dia: `Sem ${idx + 1}`, receita: total };
    });
  }, [consultorioId, seletor.periodo, seletor.tipo]);

  const label = formatPeriodoLabel(seletor.periodo, seletor.tipo);

  return (
    <>
      <div className="mb-4">
        <PeriodoSelector value={seletor} onChange={setSeletor} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Receita do período</p>
            <TrendingUp size={18} className="text-primary" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {formatBRL(r?.receita ?? 0)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {posicao > 0 && (r?.receita ?? 0) > 0
              ? `#${posicao} de ${ativos || ranking.length} consultórios`
              : "sem receita"}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Atendimentos no período</p>
            <Calendar size={18} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">{r?.atendimentos ?? 0}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Status</p>
            <DoorOpen size={18} className="text-muted-foreground" />
          </div>
          <p className="mt-2">
            {r && r.atendimentos > 0 ? (
              <Badge variant="success">Ativo</Badge>
            ) : (
              <Badge variant="secondary">Ocioso</Badge>
            )}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Receita ao longo do período</CardTitle>
          <CardDescription>
            {seletor.tipo === "semana"
              ? `Dia a dia · ${label}`
              : `Por semana · ${label}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceitaChart data={chartData} />
        </CardContent>
      </Card>
    </>
  );
}
