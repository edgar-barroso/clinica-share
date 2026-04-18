import Link from "next/link";
import { CheckCircle2, Clock, Download, Users, Wallet } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";
import { MetricStat } from "@/components/dashboard/metric-stat";
import { ReceitaChart } from "@/components/dashboard/receita-chart";
import {
  atendimentos,
  consultorios,
  profissionais,
  receitaPorConsultorio,
  receitaTotalSemana,
  repasses,
} from "@/lib/mock/data";
import { formatBRL, formatDateLong } from "@/lib/format";

export default function DashboardPage() {
  const receitaTotal = receitaTotalSemana();
  const repassesAbertos = repasses
    .filter((r) => r.status === "aberto")
    .reduce((s, r) => s + r.valorRepasse, 0);
  const repassesPagos = repasses
    .filter((r) => r.status === "pago")
    .reduce((s, r) => s + r.valorRepasse, 0);
  const ativos = profissionais.filter((p) => p.ativo).length;

  // Receita por dia 06-12/abr
  const dias = ["06", "07", "08", "09", "10", "11", "12"];
  const chartData = dias.map((d) => {
    const total = atendimentos
      .filter(
        (a) =>
          a.data === `2026-04-${d}` &&
          a.status === "realizado" &&
          a.statusPagamento === "pago",
      )
      .reduce(
        (s, a) => s + a.valorConsulta + a.procedimentos.reduce((ss, p) => ss + p.valor, 0),
        0,
      );
    return { dia: `${d}/04`, receita: total };
  });

  const ranking = receitaPorConsultorio().slice(0, 3);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Visão geral da clínica · Semana de ${formatDateLong("2026-04-06")} a ${formatDateLong("2026-04-12")}`}
        actions={
          <>
            <Button variant="outline">
              <Download size={16} />
              Exportar relatório
            </Button>
            <Link href="/financeiro/fechamento" className={buttonVariants()}>
              Fechamento semanal
            </Link>
          </>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat
          label="Receita total"
          value={formatBRL(receitaTotal)}
          delta={0.12}
          deltaLabel="vs semana anterior"
          icon={Wallet}
          tone="primary"
        />
        <MetricStat
          label="Repasses em aberto"
          value={formatBRL(repassesAbertos)}
          delta={-0.05}
          deltaLabel="vs semana anterior"
          icon={Clock}
          tone="warning"
        />
        <MetricStat
          label="Repasses pagos"
          value={formatBRL(repassesPagos)}
          delta={0.18}
          deltaLabel="vs semana anterior"
          icon={CheckCircle2}
          tone="success"
        />
        <MetricStat
          label="Profissionais ativos"
          value={`${ativos} / ${profissionais.length}`}
          icon={Users}
          tone="neutral"
        />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Receita por dia</CardTitle>
            <CardDescription>Apenas atendimentos realizados e pagos</CardDescription>
          </CardHeader>
          <CardContent>
            <ReceitaChart data={chartData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top consultórios</CardTitle>
            <CardDescription>Ranking por receita na semana</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                  <p className="text-sm font-semibold tabular-nums">{formatBRL(r.receita)}</p>
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
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Próximas ações</CardTitle>
            <CardDescription>
              O que precisa do seu olhar agora na clínica
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Link
              href="/financeiro/fechamento"
              className="rounded-xl border border-border p-4 transition-colors hover:bg-muted"
            >
              <p className="text-sm font-semibold">Fechar a semana</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {repasses.filter((r) => r.status === "aberto").length} repasses em aberto aguardam pagamento
              </p>
            </Link>
            <Link
              href="/atendimentos"
              className="rounded-xl border border-border p-4 transition-colors hover:bg-muted"
            >
              <p className="text-sm font-semibold">Revisar atendimentos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {atendimentos.filter((a) => a.statusPagamento === "pendente").length} com pagamento pendente
              </p>
            </Link>
            <Link
              href="/profissionais"
              className="rounded-xl border border-border p-4 transition-colors hover:bg-muted"
            >
              <p className="text-sm font-semibold">Contratos ativos</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {profissionais.filter((p) => p.modalidadeContrato === "percentual").length} por % e{" "}
                {profissionais.filter((p) => p.modalidadeContrato === "aluguel-fixo").length} por aluguel fixo
              </p>
            </Link>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
