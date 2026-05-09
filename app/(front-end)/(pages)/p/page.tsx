"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarCheck2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Plus,
  Stethoscope,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MetricStat } from "@/components/dashboard/metric-stat";
import { PageHeader } from "@/components/layouts/page-header";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import {
  apiListAgendamentos,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function PatientHomePage() {
  const router = useRouter();
  const { pacienteId, userNome, loading: userLoading } = useCurrentUser();
  const [todas, setTodas] = useState<AgendamentoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userLoading) return;
    if (!pacienteId) {
      router.replace("/login");
    }
  }, [pacienteId, userLoading, router]);

  const fetchData = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const { agendamentos } = await apiListAgendamentos();
      setTodas(agendamentos);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const futuras = useMemo(
    () =>
      todas
        .filter((a) => a.status === "agendado" || a.status === "em_atendimento")
        .sort((a, b) =>
          `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`),
        ),
    [todas],
  );
  const realizadas = useMemo(
    () =>
      todas
        .filter((a) => a.status === "realizado")
        .sort((a, b) =>
          `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`),
        ),
    [todas],
  );
  const proxima = futuras[0];
  const totalInvestido = realizadas
    .filter((a) => a.statusPagamento === "pago")
    .reduce((s, a) => s + Number(a.valorConsulta), 0);
  const especialidadesUnicas = new Set(
    realizadas.map((a) => a.profissional.especialidade),
  ).size;

  const primeiroNome = userNome.split(" ")[0] ?? "";

  if (userLoading || loading || !pacienteId) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando…
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title={primeiroNome ? `Olá, ${primeiroNome} 👋` : "Olá 👋"}
        description="Acompanhe suas próximas consultas e seu histórico de atendimentos"
        actions={
          <Link href="/p/agendar" className={buttonVariants()}>
            <Plus size={16} />
            Agendar consulta
          </Link>
        }
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricStat
          label="Próximas consultas"
          value={String(futuras.length)}
          icon={CalendarClock}
          tone="primary"
        />
        <MetricStat
          label="Consultas realizadas"
          value={String(realizadas.length)}
          icon={CheckCircle2}
          tone="success"
        />
        <MetricStat
          label="Investido em saúde"
          value={formatBRL(totalInvestido)}
          icon={Wallet}
          tone="neutral"
        />
        <MetricStat
          label="Especialidades visitadas"
          value={String(especialidadesUnicas)}
          icon={Stethoscope}
          tone="neutral"
        />
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {proxima ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Sua próxima consulta</CardTitle>
                <AgendamentoStatusBadge status={proxima.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-2xl font-bold leading-tight">
                    {formatDateLong(proxima.data)}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-muted-foreground tabular-nums">
                    {proxima.hora}
                  </p>
                </div>
                <Link
                  href={`/p/consultas/${proxima.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  Ver detalhes
                  <ChevronRight size={14} />
                </Link>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                  {initials(proxima.profissional.nome)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {proxima.profissional.nome}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {proxima.profissional.especialidade} ·{" "}
                    {proxima.consultorio.nome}
                  </p>
                </div>
                <PaymentStatusBadge status={proxima.statusPagamento} />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed lg:col-span-2">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarCheck2 size={20} />
              </div>
              <p className="text-base font-semibold">
                Nenhuma consulta agendada
              </p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Agende sua próxima visita com um dos nossos especialistas.
              </p>
              <Link href="/p/agendar" className={buttonVariants()}>
                <Plus size={14} />
                Agendar consulta
              </Link>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <QuickLink href="/p/agendar" icon={Plus} label="Agendar consulta" />
            <QuickLink
              href="/p/consultas"
              icon={CalendarCheck2}
              label="Minhas consultas"
              sublabel={`${futuras.length} próximas · ${realizadas.length} realizadas`}
            />
            <QuickLink
              href="/p/perfil"
              icon={Stethoscope}
              label="Meus dados"
            />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Histórico recente</CardTitle>
            <Link
              href="/p/consultas"
              className="text-sm font-medium text-primary hover:underline"
            >
              Ver tudo
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            {realizadas.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                Você ainda não tem consultas realizadas.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Consultório</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {realizadas.slice(0, 5).map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-sm tabular-nums">
                        {formatDate(a.data, "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">
                          {a.profissional.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.profissional.especialidade}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">
                        {a.consultorio.nome}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBRL(Number(a.valorConsulta))}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={a.statusPagamento} />
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
  );
}

function QuickLink({
  href,
  icon: Icon,
  label,
  sublabel,
}: {
  href: string;
  icon: typeof Plus;
  label: string;
  sublabel?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted"
    >
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        {sublabel && (
          <p className="truncate text-xs text-muted-foreground">{sublabel}</p>
        )}
      </div>
      <ChevronRight size={14} className="text-muted-foreground" />
    </Link>
  );
}
