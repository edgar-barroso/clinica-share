import Link from "next/link";
import { CheckCircle2, Clock, Users, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";
import { MetricStat } from "@/components/dashboard/metric-stat";
import { ReceitaChart } from "@/components/dashboard/receita-chart";
import { TopConsultoriosCard } from "@/components/dashboard/top-consultorios-card";
import {
  atendimentos,
  diasDaSemana,
  periodoReferencia,
  profissionais,
  repasses,
} from "@/lib/mock/data";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";

export default function DashboardPage() {
  const repassesAbertos = repasses
    .filter((r) => r.status === "aberto")
    .reduce((s, r) => s + r.valorRepasse, 0);
  const repassesPagos = repasses
    .filter((r) => r.status === "pago")
    .reduce((s, r) => s + r.valorRepasse, 0);
  const repassesTotalAReceber = repassesAbertos + repassesPagos;
  const ativos = profissionais.filter((p) => p.ativo).length;

  // Receita por dia da semana corrente
  const chartData = diasDaSemana().map((iso) => {
    const total = atendimentos
      .filter(
        (a) =>
          a.data === iso &&
          a.status === "realizado" &&
          a.statusPagamento === "pago",
      )
      .reduce(
        (s, a) => s + a.valorConsulta,
        0,
      );
    return { dia: formatDate(iso, "dd/MM"), receita: total };
  });

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Visão geral da clínica · Semana de ${formatDateLong(periodoReferencia.inicio)} a ${formatDateLong(periodoReferencia.fim)}`}
        actions={
          <Link href="/financeiro/repasses" className={buttonVariants()}>
            Repasses
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat
          label="Repasses total a receber"
          value={formatBRL(repassesTotalAReceber)}
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

        <TopConsultoriosCard />
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
              href="/financeiro/repasses"
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
