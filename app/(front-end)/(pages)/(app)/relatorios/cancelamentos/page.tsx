"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  apiRelatorioCancelamentos,
  type RelatorioCancelamentosLinha,
} from "@/lib/api/relatorios";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";

function mesAtualISO() {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

export default function RelatorioCancelamentosPage() {
  const padrao = useMemo(() => mesAtualISO(), []);
  const [dataInicio, setDataInicio] = useState(padrao.inicio);
  const [dataFim, setDataFim] = useState(padrao.fim);
  const [data, setData] = useState<{
    linhas: RelatorioCancelamentosLinha[];
    totais: { cancelados: number; naoCompareceu: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRelatorioCancelamentos({ dataInicio, dataFim });
      setData(res);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <>
      <Link
        href="/relatorios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para relatórios
      </Link>

      <PageHeader
        title="Cancelamentos & não comparecimentos"
        description="RE05 · Padrões de no-show e cancelamento"
      />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="ini">Início</Label>
            <Input
              id="ini"
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fim">Fim</Label>
            <Input
              id="fim"
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {data && data.totais.total > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {data.totais.total}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Cancelados</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
              {data.totais.cancelados}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Não compareceu</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-warning">
              {data.totais.naoCompareceu}
            </p>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detalhes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !data ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : data.linhas.length === 0 ? (
            <EmptyState
              icon={Ban}
              title="Nenhum cancelamento ou ausência no período"
              description="Excelente taxa de comparecimento."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.linhas.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">{formatDate(l.data, "dd/MM")}</div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {l.hora}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={l.status === "cancelado" ? "danger" : "warning"}
                        className="text-xs"
                      >
                        {l.status === "cancelado"
                          ? "Cancelado"
                          : "Não compareceu"}
                      </Badge>
                    </TableCell>
                    <TableCell>{l.profissional}</TableCell>
                    <TableCell>{l.paciente}</TableCell>
                    <TableCell className="max-w-md text-sm">{l.motivo}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
