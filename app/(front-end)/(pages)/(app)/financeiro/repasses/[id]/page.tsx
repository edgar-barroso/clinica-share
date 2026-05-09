"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RepasseStatusBadge } from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetRepasse,
  apiMarcarRepassePago,
  type RepasseDetalheResponse,
} from "@/lib/api/repasses";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

const TURNO_LABEL: Record<"manha" | "tarde" | "noite", string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export default function RepasseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role } = useCurrentUser();
  const podePagar = role === "admin" || role === "auxiliar";

  const [data, setData] = useState<RepasseDetalheResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiGetRepasse(id);
      setData(res);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handlePagar() {
    setSubmitting(true);
    try {
      await apiMarcarRepassePago(id);
      toast.success("Repasse marcado como pago", {
        description: "Registro gravado na auditoria",
      });
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !data) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
          <aside className="space-y-4">
            <Skeleton className="h-64 rounded-2xl" />
          </aside>
        </div>
      </div>
    );
  }

  const { repasse, breakdown } = data;
  const isPercentual = breakdown.modalidade === "percentual";

  return (
    <>
      <Link
        href="/financeiro/repasses"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para repasses
      </Link>

      <PageHeader
        title={`Repasse · ${repasse.profissional.nome}`}
        description={`${formatDateLong(repasse.periodoInicio)} – ${formatDateLong(
          repasse.periodoFim,
        )}`}
        actions={
          repasse.status === "aberto" && podePagar ? (
            <Button onClick={handlePagar} disabled={submitting}>
              <Send size={14} />
              {submitting ? "Salvando..." : "Marcar como pago"}
            </Button>
          ) : repasse.status === "pago" ? (
            <span className="flex items-center gap-1 text-sm text-success">
              <CheckCircle2 size={16} />
              Pago em{" "}
              {repasse.dataPagamento &&
                formatDate(repasse.dataPagamento, "dd/MM/yyyy")}
            </span>
          ) : null
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 bg-primary/10 text-primary">
                    <AvatarFallback>
                      {initials(repasse.profissional.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{repasse.profissional.nome}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {repasse.profissional.especialidade}
                    </p>
                  </div>
                </div>
                <RepasseStatusBadge status={repasse.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Modalidade
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {isPercentual
                      ? `${(Number(repasse.profissional.percentualRepasse) * 100).toFixed(0)}% sobre bruto pago`
                      : `Aluguel fixo · ${formatBRL(Number(repasse.profissional.valorAluguelPorTurno))} por turno`}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Atendimentos no período
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    {breakdown.detalhes.length}
                  </p>
                </div>
                {!isPercentual && (
                  <div className="sm:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Turnos cobrados
                    </p>
                    <ul className="mt-1 flex flex-wrap gap-2">
                      {breakdown.turnosUtilizados.map((t) => (
                        <li key={`${t.data}|${t.turno}`}>
                          <Badge variant="outline">
                            {formatDate(t.data, "dd/MM")} ·{" "}
                            {TURNO_LABEL[t.turno]}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Atendimentos do período</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Consultório</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repasse.atendimentos.map(({ atendimento: a }) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm">
                          {formatDate(a.data, "dd/MM")}
                        </div>
                        <div className="text-xs text-muted-foreground tabular-nums">
                          {a.hora}
                        </div>
                      </TableCell>
                      <TableCell>{a.paciente.nome}</TableCell>
                      <TableCell>{a.consultorio.nome}</TableCell>
                      <TableCell>
                        {TURNO_LABEL[
                          breakdown.detalhes.find(
                            (d) => d.atendimentoId === a.id,
                          )?.turno ?? "manha"
                        ]}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(Number(a.valorConsulta))}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.statusPagamento === "pago"
                              ? "success"
                              : a.statusPagamento === "gratuito"
                                ? "info"
                                : "outline"
                          }
                          className="text-xs capitalize"
                        >
                          {a.statusPagamento}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cálculo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm tabular-nums">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receita bruta</span>
                <span>{formatBRL(Number(repasse.receitaBruta))}</span>
              </div>
              {isPercentual ? (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Percentual</span>
                  <span>
                    ×{" "}
                    {(
                      Number(repasse.profissional.percentualRepasse) * 100
                    ).toFixed(0)}
                    %
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Turnos</span>
                    <span>{breakdown.turnosUtilizados.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aluguel/turno</span>
                    <span>
                      {formatBRL(
                        Number(repasse.profissional.valorAluguelPorTurno),
                      )}
                    </span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Valor do repasse</span>
                <span>{formatBRL(Number(repasse.valorRepasse))}</span>
              </div>
              <p className="pt-1 text-xs text-muted-foreground">
                Cálculo realizado no servidor. Atendimentos gratuitos não
                entram na base, exceto na contagem de turnos no modelo
                aluguel-fixo.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
