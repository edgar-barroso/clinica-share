"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  Clock,
  Info,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import { MetricStat } from "@/components/dashboard/metric-stat";
import { ReceitaChart } from "@/components/dashboard/receita-chart";
import {
  apiDashboardStats,
  type DashboardStats,
} from "@/lib/api/dashboard";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (periodo.fim < periodo.inicio) return; // intervalo inválido
    setLoading(true);
    try {
      const { stats } = await apiDashboardStats({
        dataInicio: periodo.inicio,
        dataFim: periodo.fim,
      });
      setStats(stats);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [periodo]);

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
        </>
      )}
    </>
  );
}
