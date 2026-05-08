"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, Users, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";
import { MetricStat } from "@/components/dashboard/metric-stat";
import { ReceitaChart } from "@/components/dashboard/receita-chart";
import {
  apiDashboardStats,
  type DashboardStats,
} from "@/lib/api/dashboard";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";

function semanaAtualISO(): { inicio: string; fim: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dow = hoje.getDay();
  const segunda = new Date(hoje);
  const diff = dow === 0 ? -6 : 1 - dow;
  segunda.setDate(hoje.getDate() + diff);
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  return { inicio: fmt(segunda), fim: fmt(domingo) };
}

export default function DashboardPage() {
  const periodo = useMemo(() => semanaAtualISO(), []);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
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

  if (loading || !stats) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando…
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Visão geral · Semana de ${formatDateLong(periodo.inicio)} a ${formatDateLong(periodo.fim)}`}
        actions={
          <Link href="/financeiro/repasses" className={buttonVariants()}>
            Repasses
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat
          label="Repasses total"
          value={formatBRL(Number(stats.repassesTotal))}
          icon={Wallet}
          tone="primary"
        />
        <MetricStat
          label="Repasses em aberto"
          value={formatBRL(Number(stats.repassesAbertos))}
          icon={Clock}
          tone="warning"
        />
        <MetricStat
          label="Repasses pagos"
          value={formatBRL(Number(stats.repassesPagos))}
          icon={CheckCircle2}
          tone="success"
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
                Sem receita registrada na semana.
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
  );
}
