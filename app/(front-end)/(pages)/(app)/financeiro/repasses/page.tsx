"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ChevronDown, Download, Send, X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  getProfissional,
  periodoReferencia,
  repasses as mockRepasses,
} from "@/lib/mock/data";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";
import type { Repasse } from "@/lib/mock/types";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function hojeISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isAtrasado(r: Repasse, hoje: string): boolean {
  return r.status === "aberto" && r.periodoFim < hoje;
}

const SEMANAS_INICIAIS = 4;
const SEMANAS_INCREMENTO = 3;

export default function RepassesPage() {
  const [repasses, setRepasses] = useState(mockRepasses);
  const [pendingPayId, setPendingPayId] = useState<string | null>(null);
  const [limite, setLimite] = useState(SEMANAS_INICIAIS);
  const hoje = hojeISO();

  function confirmarPagamento(id: string) {
    setRepasses((list) =>
      list.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "pago" as const,
              dataPagamento: hoje,
            }
          : r,
      ),
    );
    toast.success("Repasse marcado como pago", {
      description: "Audit log registrado automaticamente (RNF-102).",
    });
    setPendingPayId(null);
  }

  const repasseEmConfirmacao = pendingPayId
    ? repasses.find((r) => r.id === pendingPayId)
    : null;

  // Agrupa por período (semana) e ordena descendente (mais recente primeiro)
  const todosGrupos = useMemo(() => {
    const map = new Map<string, Repasse[]>();
    for (const r of repasses) {
      const key = `${r.periodoInicio}|${r.periodoFim}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, list]) => {
        const [inicio, fim] = key.split("|");
        const temAtrasado = list.some((r) => isAtrasado(r, hoje));
        return { inicio, fim, list, temAtrasado };
      });
  }, [repasses, hoje]);

  // Mostra: todos os com atrasados + as `limite` semanas mais recentes (sem duplicar)
  const grupos = useMemo(() => {
    const visiveis: typeof todosGrupos = [];
    let semanasContadas = 0;
    for (const g of todosGrupos) {
      if (g.temAtrasado || semanasContadas < limite) {
        visiveis.push(g);
        semanasContadas += 1;
      }
    }
    return visiveis;
  }, [todosGrupos, limite]);

  const semanasOcultas = todosGrupos.length - grupos.length;

  const atrasados = repasses.filter((r) => isAtrasado(r, hoje));
  const abertosNoPrazo = repasses.filter(
    (r) => r.status === "aberto" && !isAtrasado(r, hoje),
  );
  const totalAtrasado = atrasados.reduce((s, r) => s + r.valorRepasse, 0);
  const totalAbertosNoPrazo = abertosNoPrazo.reduce(
    (s, r) => s + r.valorRepasse,
    0,
  );
  const repassesSemanaAtual = repasses.filter(
    (r) => r.periodoInicio === periodoReferencia.inicio,
  );
  const totalRepasseSemana = repassesSemanaAtual.reduce(
    (s, r) => s + r.valorRepasse,
    0,
  );
  const totalBrutoSemana = repassesSemanaAtual.reduce(
    (s, r) => s + r.receitaBruta,
    0,
  );

  return (
    <>
      <PageHeader
        title="Repasses"
        description="Prestação de contas semanal (FI07)"
        actions={
          <Button variant="outline">
            <Download size={16} />
            Exportar PDF
          </Button>
        }
      />

      {atrasados.length > 0 && (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-destructive"
            />
            <div>
              <p className="text-sm font-semibold text-destructive">
                {atrasados.length} repasses atrasados de semanas anteriores
              </p>
              <p className="text-xs text-muted-foreground">
                Total atrasado:{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {formatBRL(totalAtrasado)}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Atrasados</p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${
              atrasados.length > 0 ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {formatBRL(totalAtrasado)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {atrasados.length} repasses
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Em aberto (no prazo)</p>
          <p className="mt-1 text-2xl font-bold text-warning tabular-nums">
            {formatBRL(totalAbertosNoPrazo)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {abertosNoPrazo.length} repasses · semana atual
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            Total repasses · semana atual
          </p>
          <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
            {formatBRL(totalRepasseSemana)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            sobre {formatBRL(totalBrutoSemana)} bruto
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">
            Margem · semana atual
          </p>
          <p className="mt-1 text-2xl font-bold text-success tabular-nums">
            {formatBRL(totalBrutoSemana - totalRepasseSemana)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Receita que fica com a clínica
          </p>
        </Card>
      </div>

      <div className="space-y-6">
        {grupos.map((g) => {
          const ehSemanaAtual = g.inicio === periodoReferencia.inicio;
          const abertosGrupo = g.list.filter((r) => r.status === "aberto");
          const pagosGrupo = g.list.filter((r) => r.status === "pago");
          const atrasadosGrupo = g.list.filter((r) => isAtrasado(r, hoje));

          return (
            <Card key={`${g.inicio}-${g.fim}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base">
                    Semana de {formatDate(g.inicio, "dd/MM")} a{" "}
                    {formatDate(g.fim, "dd/MM")}
                    {ehSemanaAtual && (
                      <Badge variant="info" className="ml-2 align-middle">
                        Semana atual
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {atrasadosGrupo.length > 0 ? (
                      <span className="font-medium text-destructive">
                        {atrasadosGrupo.length} atrasados ·{" "}
                      </span>
                    ) : null}
                    {abertosGrupo.length - atrasadosGrupo.length > 0 && (
                      <>
                        {abertosGrupo.length - atrasadosGrupo.length} em aberto ·{" "}
                      </>
                    )}
                    {pagosGrupo.length} pagos
                  </p>
                </div>
                {abertosGrupo.length === 0 && (
                  <Badge variant="success">Semana fechada</Badge>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead className="text-right">Atendimentos</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Repasse</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {g.list.map((r) => {
                      const prof = getProfissional(r.profissionalId)!;
                      const atrasado = isAtrasado(r, hoje);
                      return (
                        <TableRow
                          key={r.id}
                          className={atrasado ? "bg-destructive/5" : undefined}
                        >
                          <TableCell>
                            <Link
                              href={`/financeiro/repasses/${r.id}`}
                              className="block hover:text-primary"
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9 bg-primary/10 text-primary">
                                  <AvatarFallback>
                                    {initials(prof.nome)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">
                                    {prof.nome}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {prof.especialidade}
                                  </p>
                                </div>
                              </div>
                            </Link>
                          </TableCell>
                          <TableCell>
                            {prof.modalidadeContrato === "percentual" ? (
                              <span className="text-sm">
                                {formatPercent(prof.percentualRepasse ?? 0)}{" "}
                                sobre bruto
                              </span>
                            ) : (
                              <span className="text-sm">
                                {formatBRL(prof.valorAluguelPorTurno ?? 0)} por
                                turno
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {r.atendimentosIds.length}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatBRL(r.receitaBruta)}
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatBRL(r.valorRepasse)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col items-start">
                              <RepasseStatusBadge
                                status={r.status}
                                atrasado={atrasado}
                              />
                              {r.dataPagamento && (
                                <span className="mt-1 text-xs text-muted-foreground">
                                  {formatDate(r.dataPagamento, "dd/MM/yyyy")}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {r.status === "aberto" ? (
                              <Button
                                size="sm"
                                variant={atrasado ? "destructive" : "outline"}
                                onClick={() => setPendingPayId(r.id)}
                              >
                                <Send size={14} />
                                Pagar
                              </Button>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-success">
                                <CheckCircle2 size={14} /> Pago
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}

        {semanasOcultas > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLimite((l) => l + SEMANAS_INCREMENTO)}
            >
              <ChevronDown size={14} />
              Carregar semanas anteriores ({semanasOcultas} restantes)
            </Button>
          </div>
        )}
      </div>

      {repasseEmConfirmacao && (
        <ConfirmarPagamentoDialog
          repasse={repasseEmConfirmacao}
          atrasado={isAtrasado(repasseEmConfirmacao, hoje)}
          onClose={() => setPendingPayId(null)}
          onConfirm={() => confirmarPagamento(repasseEmConfirmacao.id)}
        />
      )}
    </>
  );
}

function ConfirmarPagamentoDialog({
  repasse,
  atrasado,
  onClose,
  onConfirm,
}: {
  repasse: Repasse;
  atrasado: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const prof = getProfissional(repasse.profissionalId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Confirmar pagamento</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Esta ação registra audit log (RNF-102) e não pode ser desfeita.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 bg-primary/10 text-primary">
              <AvatarFallback>{initials(prof?.nome ?? "")}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{prof?.nome}</p>
              <p className="text-xs text-muted-foreground">
                {prof?.especialidade}
              </p>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período</span>
              <span className="tabular-nums">
                {formatDate(repasse.periodoInicio, "dd/MM")} –{" "}
                {formatDate(repasse.periodoFim, "dd/MM")}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Receita bruta</span>
              <span className="tabular-nums">
                {formatBRL(repasse.receitaBruta)}
              </span>
            </div>
            <div className="mt-1 flex justify-between text-base font-semibold">
              <span>Valor a pagar</span>
              <span className="tabular-nums">
                {formatBRL(repasse.valorRepasse)}
              </span>
            </div>
          </div>
          {atrasado && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>
                Este repasse está atrasado — período encerrou em{" "}
                {formatDate(repasse.periodoFim, "dd/MM/yyyy")}.
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant={atrasado ? "destructive" : "default"}
            className="flex-1"
            onClick={onConfirm}
          >
            <CheckCircle2 size={14} />
            Confirmar pagamento
          </Button>
        </div>
      </div>
    </div>
  );
}
