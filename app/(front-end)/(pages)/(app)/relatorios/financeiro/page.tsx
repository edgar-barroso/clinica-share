"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  apiRelatorioFinanceiro,
  type RelatorioFinanceiroResponse,
} from "@/lib/api/relatorios";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";

function mesAtualISO(): { inicio: string; fim: string } {
  const hoje = new Date();
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate(),
    ).padStart(2, "0")}`;
  return { inicio: fmt(inicio), fim: fmt(fim) };
}

export default function RelatorioFinanceiroPage() {
  const padrao = useMemo(() => mesAtualISO(), []);
  const [dataInicio, setDataInicio] = useState(padrao.inicio);
  const [dataFim, setDataFim] = useState(padrao.fim);
  const [data, setData] = useState<RelatorioFinanceiroResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRelatorioFinanceiro({ dataInicio, dataFim });
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
        title="Relatório financeiro"
        description="RE02 · Receita bruta, repasses estimados e margem por profissional"
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

      <Card>
        <CardHeader>
          <CardTitle>
            Por profissional
            {data && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                · {data.totais.qtdAtendimentos} atendimentos
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading || !data ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : data.linhas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Sem atendimentos pagos no período.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead className="text-right">Atendimentos</TableHead>
                  <TableHead className="text-right">Receita bruta</TableHead>
                  <TableHead className="text-right">Repasse estimado</TableHead>
                  <TableHead className="text-right">Margem clínica</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.linhas.map((l) => (
                  <TableRow key={l.profissionalId}>
                    <TableCell className="font-medium">
                      {l.profissionalNome}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {l.modalidade}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {l.qtdAtendimentos}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(l.receitaBruta))}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-warning">
                      {formatBRL(Number(l.repasseEstimado))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-success">
                      {formatBRL(Number(l.margemClinica))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30 font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {data.totais.qtdAtendimentos}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(data.totais.receitaBruta))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(data.totais.repasseEstimado))}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatBRL(Number(data.totais.margemClinica))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
