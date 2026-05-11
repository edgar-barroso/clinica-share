"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  Info,
  Percent,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { ReceitaChart } from "@/components/dashboard/receita-chart";
import { ConsultorioDetalheModal } from "@/components/consultorios/consultorio-detalhe-modal";
import {
  apiDashboardStats,
  type DashboardStats,
} from "@/lib/api/dashboard";
import {
  apiDashboardConsultorios,
  type DashboardConsultoriosResponse,
  type DashboardConsultoriosLinha,
  type ModalidadeFiltro,
} from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

const MODALIDADE_LABEL: Record<ModalidadeFiltro, string> = {
  todos: "Todas as modalidades",
  aluguel_fixo: "Apenas aluguel fixo",
  percentual: "Apenas percentual",
};

function formatPercent(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function gerarCsvConsultorios(linhas: DashboardConsultoriosLinha[]): string {
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

function fmtIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function mesAtualISO(): { inicio: string; fim: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  return { inicio: fmtIso(ini), fim: fmtIso(fim) };
}

type ModoPeriodo = "mes" | "custom";

const LABEL_MODO: Record<ModoPeriodo, string> = {
  mes: "Mês atual",
  custom: "Personalizado",
};

export default function DashboardPage() {
  const mesAtual = useMemo(() => mesAtualISO(), []);

  const [modo, setModo] = useState<ModoPeriodo>("mes");
  const [customInicio, setCustomInicio] = useState(mesAtual.inicio);
  const [customFim, setCustomFim] = useState(mesAtual.fim);

  const periodo = useMemo(() => {
    if (modo === "mes") return mesAtual;
    return { inicio: customInicio, fim: customFim };
  }, [modo, mesAtual, customInicio, customFim]);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [consultoriosData, setConsultoriosData] =
    useState<DashboardConsultoriosResponse | null>(null);
  const [modalidade, setModalidade] = useState<ModalidadeFiltro>("todos");
  const [loading, setLoading] = useState(true);
  const [consultorioAberto, setConsultorioAberto] = useState<
    DashboardConsultoriosLinha | null
  >(null);

  const fetchData = useCallback(async () => {
    if (!periodo.inicio || !periodo.fim) return; // usuário ainda editando
    if (periodo.fim < periodo.inicio) return; // intervalo inválido
    setLoading(true);
    try {
      const [statsRes, consultoriosRes] = await Promise.all([
        apiDashboardStats({
          dataInicio: periodo.inicio,
          dataFim: periodo.fim,
        }),
        apiDashboardConsultorios({
          dataInicio: periodo.inicio,
          dataFim: periodo.fim,
          modalidade,
        }),
      ]);
      setStats(statsRes.stats);
      setConsultoriosData(consultoriosRes);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [periodo, modalidade]);

  const handleExportarConsultorios = useCallback(() => {
    if (!consultoriosData || consultoriosData.linhas.length === 0) {
      toast.error("Nada para exportar no período selecionado");
      return;
    }
    const csv = gerarCsvConsultorios(consultoriosData.linhas);
    baixarCsv(
      `dashboard-consultorios_${periodo.inicio}_${periodo.fim}.csv`,
      csv,
    );
    toast.success("CSV exportado");
  }, [consultoriosData, periodo]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const chartData = useMemo(
    () =>
      (stats?.receitaPorDia ?? []).map((p) => ({
        dia: formatDate(p.data, "dd/MM"),
        receita: Number(p.receita),
      })),
    [stats],
  );

  // Repasses são fechados pelo cron toda segunda. Se o intervalo ainda
  // está em curso (fim >= hoje) e há receita bruta mas nada de repasse,
  // explicamos que o repasse vai aparecer depois que a semana fechar.
  const hojeIso = useMemo(() => fmtIso(new Date()), []);
  const intervaloEmCurso = periodo.fim >= hojeIso;
  const semRepasses =
    !!stats && Number(stats.repassesTotal) === 0 && Number(stats.receitaBruta) > 0;
  const proximaSegunda = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const dow = d.getDay(); // 0=Dom..6=Sáb
    const daysUntilMonday = ((1 - dow + 7) % 7) || 7;
    d.setDate(d.getDate() + daysUntilMonday);
    return fmtIso(d);
  }, []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${LABEL_MODO[modo]} · ${formatDateLong(periodo.inicio)} a ${formatDateLong(periodo.fim)}`}
        actions={
          <Link href="/financeiro/repasses" className={buttonVariants()}>
            Repasses
          </Link>
        }
      />

      <Card className="mb-6">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold">Período de análise</p>
            <div className="inline-flex rounded-xl border border-border bg-card p-1 text-sm">
              {(["mes", "custom"] as ModoPeriodo[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModo(m)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 font-medium transition-colors",
                    modo === m
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {LABEL_MODO[m]}
                </button>
              ))}
            </div>
          </div>

          {modo === "custom" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="custom-ini">Início</Label>
                <Input
                  id="custom-ini"
                  type="date"
                  value={customInicio}
                  max={customFim}
                  onChange={(e) => setCustomInicio(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="custom-fim">Fim</Label>
                <Input
                  id="custom-fim"
                  type="date"
                  value={customFim}
                  min={customInicio}
                  onChange={(e) => setCustomFim(e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {loading || !stats ? (
        <div aria-hidden="true">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </section>
          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-80 rounded-2xl" />
          </section>
          <section className="mt-8">
            <Skeleton className="h-72 rounded-2xl" />
          </section>
        </div>
      ) : (
        <>
          {semRepasses && intervaloEmCurso && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
              <Info size={16} className="mt-0.5 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="font-medium text-foreground">
                  Período ainda em curso — repasses serão fechados em{" "}
                  {formatDate(proximaSegunda, "dd/MM")}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  A <strong>receita bruta</strong> mostra o que já passou em
                  consulta agora. Os <strong>repasses</strong> são gerados
                  automaticamente toda segunda-feira de manhã, cobrindo a
                  semana anterior — por isso ainda aparecem zerados aqui.
                </p>
              </div>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <MetricStat
              label="Receita bruta"
              value={formatBRL(Number(stats.receitaBruta))}
              icon={TrendingUp}
              tone="primary"
              hint={`${stats.qtdAtendimentosRealizados} atendimentos realizados`}
            />
            <MetricStat
              label="Repasses total"
              value={formatBRL(Number(stats.repassesTotal))}
              icon={Wallet}
              tone="neutral"
              hint={
                intervaloEmCurso && Number(stats.repassesTotal) === 0
                  ? `Fecha em ${formatDate(proximaSegunda, "dd/MM")}`
                  : undefined
              }
            />
            <MetricStat
              label="Repasses em aberto"
              value={formatBRL(Number(stats.repassesAbertos))}
              icon={Clock}
              tone="warning"
              hint={
                stats.qtdRepassesAbertos > 0
                  ? `${stats.qtdRepassesAbertos} aguardando pagamento`
                  : undefined
              }
            />
            <MetricStat
              label="Repasses pagos"
              value={formatBRL(Number(stats.repassesPagos))}
              icon={CheckCircle2}
              tone="success"
              hint={
                stats.qtdRepassesPagos > 0
                  ? `${stats.qtdRepassesPagos} liquidados`
                  : undefined
              }
            />
            <MetricStat
              label="Profissionais ativos"
              value={`${stats.profissionaisAtivos} / ${stats.profissionaisTotal}`}
              icon={Users}
              tone="neutral"
            />
          </section>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Receita por dia</CardTitle>
                <CardDescription>
                  Apenas atendimentos realizados e pagos
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Sem receita registrada no período.
                  </p>
                ) : (
                  <ReceitaChart data={chartData} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Próximas ações</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/financeiro/repasses"
                  className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted"
                >
                  <p className="text-sm font-semibold">Fechar a semana</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.qtdRepassesAbertos} repasses em aberto aguardam pagamento
                  </p>
                </Link>
                <Link
                  href="/atendimentos"
                  className="block rounded-xl border border-border p-4 transition-colors hover:bg-muted"
                >
                  <p className="text-sm font-semibold">Revisar atendimentos</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {stats.atendimentosPendentes} com pagamento pendente
                  </p>
                </Link>
              </CardContent>
            </Card>
          </section>

          <section className="mt-12 space-y-6">
            <div className="flex flex-col gap-1">
              <h2 className="text-xl font-semibold">
                Ocupação e receita por consultório
              </h2>
              <p className="text-sm text-muted-foreground">
                Indicadores e ranking dos consultórios da clínica no período
              </p>
            </div>

            <Card>
              <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
                <div className="space-y-1.5">
                  <Label htmlFor="modalidade">Modalidade de contrato</Label>
                  <Select
                    id="modalidade"
                    value={modalidade}
                    onChange={(e) =>
                      setModalidade(e.target.value as ModalidadeFiltro)
                    }
                  >
                    {(
                      ["todos", "aluguel_fixo", "percentual"] as ModalidadeFiltro[]
                    ).map((m) => (
                      <option key={m} value={m}>
                        {MODALIDADE_LABEL[m]}
                      </option>
                    ))}
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExportarConsultorios}
                  disabled={
                    !consultoriosData || consultoriosData.linhas.length === 0
                  }
                >
                  <Download size={16} />
                  Exportar CSV
                </Button>
              </CardContent>
            </Card>

            {consultoriosData && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricStat
                  label="Atendimentos no período"
                  value={consultoriosData.kpis.totalAtendimentos.toLocaleString(
                    "pt-BR",
                  )}
                  icon={ClipboardList}
                  tone="neutral"
                  hint="Realizados e pagos"
                />
                <MetricStat
                  label="Receita dos consultórios"
                  value={formatBRL(Number(consultoriosData.kpis.receitaTotal))}
                  icon={TrendingUp}
                  tone="primary"
                />
                <MetricStat
                  label="Taxa de ocupação média"
                  value={formatPercent(consultoriosData.kpis.taxaOcupacaoMedia)}
                  icon={Percent}
                  tone="success"
                  hint="3 turnos × dias úteis"
                />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Ranking por receita</CardTitle>
                <CardDescription>
                  Clique numa linha para ver atendimentos, profissionais e
                  modalidade de contrato
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {!consultoriosData || consultoriosData.linhas.length === 0 ? (
                  <p className="py-10 text-center text-sm text-muted-foreground">
                    Sem atendimentos pagos no período.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Consultório</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">
                          Atendimentos
                        </TableHead>
                        <TableHead className="text-right">Receita</TableHead>
                        <TableHead className="text-right">
                          Média/atend.
                        </TableHead>
                        <TableHead className="text-right">Ocupação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultoriosData.linhas.map((l, idx) => (
                        <TableRow
                          key={l.consultorioId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setConsultorioAberto(l)}
                        >
                          <TableCell
                            className={cn(
                              "font-bold tabular-nums",
                              idx === 0 && "text-primary",
                            )}
                          >
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
          </section>
        </>
      )}

      <ConsultorioDetalheModal
        open={consultorioAberto !== null}
        onOpenChange={(open) => !open && setConsultorioAberto(null)}
        consultorioId={consultorioAberto?.consultorioId ?? null}
        nomeFallback={consultorioAberto?.nome ?? ""}
        dataInicio={periodo.inicio}
        dataFim={periodo.fim}
      />
    </>
  );
}
