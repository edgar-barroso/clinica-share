"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, X } from "lucide-react";
import {
  Card,
  CardContent,
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
import {
  apiRelatorioFinanceiro,
  type RelatorioFinanceiroResponse,
} from "@/lib/api/relatorios";
import {
  apiListProfissionais,
  type Profissional,
} from "@/lib/api/profissionais";
import {
  apiListConsultorios,
  type Consultorio,
} from "@/lib/api/consultorios";
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
  const [profissionalId, setProfissionalId] = useState("");
  const [consultorioId, setConsultorioId] = useState("");
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [data, setData] = useState<RelatorioFinanceiroResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Catálogos dos filtros: inclui inativos porque o relatório é histórico —
  // um profissional desativado hoje pode ter receita no período consultado.
  useEffect(() => {
    let cancelado = false;
    void Promise.all([
      apiListProfissionais({ ativo: "all" }),
      apiListConsultorios({ ativo: "all" }),
    ])
      .then(([p, c]) => {
        if (cancelado) return;
        setProfissionais(p.profissionais);
        setConsultorios(c.consultorios);
      })
      .catch((err) => {
        if (!cancelado) toast.error(apiErrorMessage(err));
      });
    return () => {
      cancelado = true;
    };
  }, []);

  const fetchData = useCallback(async () => {
    if (!dataInicio || !dataFim) return; // usuário ainda editando
    setLoading(true);
    try {
      const res = await apiRelatorioFinanceiro({
        dataInicio,
        dataFim,
        profissionalId: profissionalId || undefined,
        consultorioId: consultorioId || undefined,
      });
      setData(res);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [dataInicio, dataFim, profissionalId, consultorioId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const filtrosAtivos = profissionalId !== "" || consultorioId !== "";

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
        description="Receita bruta, repasses estimados e margem por profissional"
      />

      <Card className="mb-6">
        <CardContent className="space-y-3 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="space-y-1.5">
              <Label htmlFor="profissional">Profissional</Label>
              <Select
                id="profissional"
                value={profissionalId}
                onChange={(e) => setProfissionalId(e.target.value)}
              >
                <option value="">Todos os profissionais</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.ativo ? p.nome : `${p.nome} (inativo)`}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="consultorio">Consultório</Label>
              <Select
                id="consultorio"
                value={consultorioId}
                onChange={(e) => setConsultorioId(e.target.value)}
              >
                <option value="">Todos os consultórios</option>
                {consultorios.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ativo ? c.nome : `${c.nome} (inativo)`}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          {filtrosAtivos && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setProfissionalId("");
                  setConsultorioId("");
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <X size={12} />
                Limpar filtros
              </button>
            </div>
          )}
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
              <TableBody aria-hidden="true">
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-8" />
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
            <p className="py-10 text-center text-sm text-muted-foreground">
              {filtrosAtivos
                ? "Sem atendimentos pagos no período com os filtros atuais."
                : "Sem atendimentos pagos no período."}
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
