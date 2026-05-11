"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ClipboardList,
  Download,
  Percent,
  TrendingUp,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layouts/page-header";
import { MetricStat } from "@/components/dashboard/metric-stat";
import { ConsultorioDetalheModal } from "@/components/consultorios/consultorio-detalhe-modal";
import {
  apiDashboardConsultorios,
  type DashboardConsultoriosResponse,
  type DashboardConsultoriosLinha,
  type ModalidadeFiltro,
} from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

/** Semana atual: segunda a domingo (UC002 passo 2: "período padrão (semana atual)") */
function semanaAtualISO(): { inicio: string; fim: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dow = hoje.getDay(); // 0=Dom..6=Sáb
  const diffParaSegunda = dow === 0 ? -6 : 1 - dow;
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + diffParaSegunda);
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  return { inicio: fmt(segunda), fim: fmt(domingo) };
}

const MODALIDADE_LABEL: Record<ModalidadeFiltro, string> = {
  todos: "Todas as modalidades",
  aluguel_fixo: "Apenas aluguel fixo",
  percentual: "Apenas percentual",
};

function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function gerarCsv(linhas: DashboardConsultoriosLinha[]): string {
  const header = [
    "Posição",
    "Consultório",
    "Tipo",
    "Atendimentos",
    "Receita total",
    "Receita média por atendimento",
    "Taxa de ocupação (%)",
  ];
  const rows = linhas.map((l, idx) => [
    String(idx + 1),
    l.nome,
    l.tipo,
    String(l.qtdAtendimentos),
    l.receitaTotal,
    l.receitaMediaPorAtendimento,
    (l.taxaOcupacao * 100).toFixed(1),
  ]);
  const escape = (cell: string) =>
    /[",;\n]/.test(cell) ? `"${cell.replace(/"/g, '""')}"` : cell;
  return [header, ...rows]
    .map((r) => r.map(escape).join(";"))
    .join("\n");
}

function baixarCsv(filename: string, conteudo: string) {
  const blob = new Blob([`﻿${conteudo}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function DashboardConsultoriosPage() {
  const padrao = useMemo(() => semanaAtualISO(), []);
  const [dataInicio, setDataInicio] = useState(padrao.inicio);
  const [dataFim, setDataFim] = useState(padrao.fim);
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("todos");
  const [data, setData] = useState<DashboardConsultoriosResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [consultorioAberto, setConsultorioAberto] = useState<
    DashboardConsultoriosLinha | null
  >(null);

  const fetchData = useCallback(async () => {
    if (!dataInicio || !dataFim) return;
    if (dataFim < dataInicio) return;
    setLoading(true);
    try {
      const res = await apiDashboardConsultorios({
        dataInicio,
        dataFim,
        modalidade,
      });
      setData(res);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, modalidade]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleExportar = useCallback(() => {
    if (!data || data.linhas.length === 0) {
      toast.error("Nada para exportar no período selecionado");
      return;
    }
    const csv = gerarCsv(data.linhas);
    baixarCsv(
      `dashboard-consultorios_${dataInicio}_${dataFim}.csv`,
      csv,
    );
    toast.success("CSV exportado");
  }, [data, dataInicio, dataFim]);

  return (
    <>
      <Link
        href="/consultorios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para consultórios
      </Link>

      <PageHeader
        title="Dashboard de ocupação e receita"
        description="Indicadores e ranking dos consultórios da clínica"
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={handleExportar}
            disabled={loading || !data || data.linhas.length === 0}
          >
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ini">Início</Label>
            <Input
              id="ini"
              type="date"
              value={dataInicio}
              max={dataFim}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fim">Fim</Label>
            <Input
              id="fim"
              type="date"
              value={dataFim}
              min={dataInicio}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modalidade">Modalidade de contrato</Label>
            <Select
              id="modalidade"
              value={modalidade}
              onChange={(e) =>
                setModalidade(e.target.value as ModalidadeFiltro)
              }
            >
              {(["todos", "aluguel_fixo", "percentual"] as ModalidadeFiltro[]).map(
                (m) => (
                  <option key={m} value={m}>
                    {MODALIDADE_LABEL[m]}
                  </option>
                ),
              )}
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading || !data ? (
        <div aria-hidden="true" className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </section>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <MetricStat
              label="Total de atendimentos"
              value={data.kpis.totalAtendimentos.toLocaleString("pt-BR")}
              icon={ClipboardList}
              tone="neutral"
              hint="Realizados e pagos no período"
            />
            <MetricStat
              label="Receita total"
              value={formatBRL(Number(data.kpis.receitaTotal))}
              icon={TrendingUp}
              tone="primary"
            />
            <MetricStat
              label="Taxa de ocupação média"
              value={formatPercent(data.kpis.taxaOcupacaoMedia)}
              icon={Percent}
              tone="success"
              hint="3 turnos × dias úteis"
            />
          </section>

          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Ranking por receita</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {data.linhas.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Sem atendimentos no período selecionado.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Consultório</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Atendimentos</TableHead>
                      <TableHead className="text-right">Receita</TableHead>
                      <TableHead className="text-right">Média/atend.</TableHead>
                      <TableHead className="text-right">Ocupação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.linhas.map((l, idx) => (
                      <TableRow
                        key={l.consultorioId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setConsultorioAberto(l)}
                      >
                        <TableCell className="font-bold tabular-nums">
                          {idx + 1}
                        </TableCell>
                        <TableCell className="font-medium">{l.nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {l.tipo}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {l.qtdAtendimentos}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatBRL(Number(l.receitaTotal))}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {l.qtdAtendimentos > 0
                            ? formatBRL(Number(l.receitaMediaPorAtendimento))
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatPercent(l.taxaOcupacao)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ConsultorioDetalheModal
        open={consultorioAberto !== null}
        onOpenChange={(open) => !open && setConsultorioAberto(null)}
        consultorioId={consultorioAberto?.consultorioId ?? null}
        nomeFallback={consultorioAberto?.nome ?? ""}
        dataInicio={dataInicio}
        dataFim={dataFim}
      />

      <div className="mt-8 flex justify-start">
        <Link
          href="/relatorios/consultorios"
          className={buttonVariants({ variant: "outline" })}
        >
          Ver ranking compacto
        </Link>
      </div>
    </>
  );
}
