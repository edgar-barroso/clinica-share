"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Download, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layouts/page-header";
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

export default function RelatorioConsultoriosPage() {
  const [seletor, setSeletor] = useState<PeriodoSelectorValue>(() => ({
    tipo: "semana",
    periodo: semanaAtual(),
  }));

  const ranking = useMemo(
    () => receitaPorConsultorio(seletor.periodo),
    [seletor.periodo],
  );
  const total = ranking.reduce((s, r) => s + r.receita, 0);
  const label = formatPeriodoLabel(seletor.periodo, seletor.tipo);

  return (
    <>
      <Link
        href="/relatorios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Todos os relatórios
      </Link>

      <PageHeader
        title="Ranking de consultórios (RE03)"
        description={`Receita gerada por sala em ${label}. Sala ociosa pode ser candidata a renegociação de modalidade.`}
        actions={
          <Button variant="outline">
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PeriodoSelector value={seletor} onChange={setSeletor} />
        <p className="text-sm text-muted-foreground">
          Total no período:{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatBRL(total)}
          </span>
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Consultório</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
                <TableHead className="text-right">Receita</TableHead>
                <TableHead className="text-right">% do total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranking.map((r, idx) => {
                const c = consultorios.find((cc) => cc.id === r.consultorioId)!;
                const pct = total > 0 ? r.receita / total : 0;
                const ocioso = r.atendimentos === 0;
                return (
                  <TableRow key={r.consultorioId}>
                    <TableCell>
                      {idx === 0 && r.receita > 0 ? (
                        <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          <Trophy size={14} />
                        </div>
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                          #{idx + 1}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{c.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.especialidadesCompativeis.slice(0, 2).join(", ")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ocioso ? "secondary" : "outline"}>{c.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.atendimentos}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(r.receita)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {(pct * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
