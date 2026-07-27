"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Gift } from "lucide-react";
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
import {
  apiRelatorioGratuitas,
  type RelatorioGratuitasResponse,
} from "@/lib/api/relatorios";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/format";

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

/** Mesma ordem no skeleton e na tabela real — evita "pulo" de layout. */
function ColunasHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Data</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Profissional</TableHead>
        <TableHead>Paciente</TableHead>
        <TableHead>Motivo</TableHead>
        <TableHead className="text-right">Valor de tabela</TableHead>
        <TableHead className="text-right">Valor cobrado</TableHead>
        <TableHead className="text-right">Desconto</TableHead>
      </TableRow>
    </TableHeader>
  );
}

export default function RelatorioGratuitasPage() {
  const padrao = useMemo(() => mesAtualISO(), []);
  const [dataInicio, setDataInicio] = useState(padrao.inicio);
  const [dataFim, setDataFim] = useState(padrao.fim);
  const [data, setData] = useState<RelatorioGratuitasResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!dataInicio || !dataFim) return; // usuário ainda editando
    setLoading(true);
    try {
      const res = await apiRelatorioGratuitas({ dataInicio, dataFim });
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
        title="Gratuidades & descontos"
        description="Cortesias integrais e descontos parciais concedidos no período, com o valor que a clínica deixou de faturar"
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

      {loading || !data ? (
        <div
          aria-hidden="true"
          className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-8 w-20" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Gratuidades</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-info">
              {data.totalGratuidades}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Atendimentos sem cobrança
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">Descontos</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-warning">
              {data.totalDescontos}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Atendimentos cobrados abaixo da tabela
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">
              Valor total concedido
            </p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-destructive">
              {formatBRL(Number(data.valorTotalConcedido))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Receita que deixou de ser faturada
            </p>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {data?.totalAtendimentos ?? 0} atendimentos com gratuidade ou
            desconto
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !data ? (
            <Table>
              <ColunasHeader />
              <TableBody aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="mt-1 h-3 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="mt-1 h-3 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-40" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : data.linhas.length === 0 ? (
            <EmptyState
              icon={Gift}
              title="Nenhuma gratuidade ou desconto no período"
              description="Todos os atendimentos foram cobrados pelo valor de tabela."
            />
          ) : (
            <Table>
              <ColunasHeader />
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
                        variant={l.tipo === "gratuidade" ? "info" : "warning"}
                        className="text-xs"
                      >
                        {l.tipo === "gratuidade" ? "Gratuidade" : "Desconto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{l.profissional}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.especialidade}
                      </p>
                    </TableCell>
                    <TableCell>{l.paciente}</TableCell>
                    <TableCell className="max-w-xs text-sm">{l.motivo}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(l.valorOriginal))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(l.valorCobrado))}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums text-destructive">
                      {formatBRL(Number(l.valorDesconto))}
                    </TableCell>
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
