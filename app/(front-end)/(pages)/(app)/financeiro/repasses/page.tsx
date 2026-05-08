"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Plus, Send } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
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
  apiGerarRepasse,
  apiListRepasses,
  apiMarcarRepassePago,
  type RepasseListItem,
} from "@/lib/api/repasses";
import {
  apiListProfissionais,
  type Profissional,
} from "@/lib/api/profissionais";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function semanaAtualISO(): { inicio: string; fim: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dow = hoje.getDay(); // 0=dom, 1=seg, ..., 6=sab
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

export default function RepassesPage() {
  const { role } = useCurrentUser();
  const podeGerar = role === "admin" || role === "auxiliar";
  const [repasses, setRepasses] = useState<RepasseListItem[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGerar, setShowGerar] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState("");
  const semanaPadrao = useMemo(() => semanaAtualISO(), []);
  const [periodoInicio, setPeriodoInicio] = useState(semanaPadrao.inicio);
  const [periodoFim, setPeriodoFim] = useState(semanaPadrao.fim);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [repasseRes, profRes] = await Promise.all([
        apiListRepasses(),
        podeGerar
          ? apiListProfissionais({ ativo: true })
          : Promise.resolve({ profissionais: [] }),
      ]);
      setRepasses(repasseRes.repasses);
      setProfissionais(profRes.profissionais);
      if (profRes.profissionais.length > 0 && !selectedProfId) {
        setSelectedProfId(profRes.profissionais[0].id);
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podeGerar]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleGerar() {
    if (!selectedProfId) {
      toast.warning("Selecione um profissional");
      return;
    }
    setSubmitting(true);
    try {
      await apiGerarRepasse({
        profissionalId: selectedProfId,
        periodoInicio,
        periodoFim,
      });
      toast.success("Repasse gerado");
      setShowGerar(false);
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePagar(id: string) {
    try {
      await apiMarcarRepassePago(id);
      toast.success("Repasse marcado como pago", {
        description: "Audit log gravado (RNF-102)",
      });
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const totalAberto = repasses
    .filter((r) => r.status === "aberto")
    .reduce((s, r) => s + Number(r.valorRepasse), 0);
  const totalPago = repasses
    .filter((r) => r.status === "pago")
    .reduce((s, r) => s + Number(r.valorRepasse), 0);

  return (
    <>
      <PageHeader
        title="Repasses"
        description="Prestação de contas semanal (FI07/FI08)"
        actions={
          podeGerar && (
            <Button onClick={() => setShowGerar((s) => !s)}>
              <Plus size={16} />
              Gerar repasse
            </Button>
          )
        }
      />

      {showGerar && podeGerar && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gerar repasse — período</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-2">
              <Label htmlFor="prof">Profissional</Label>
              <Select
                id="prof"
                value={selectedProfId}
                onChange={(e) => setSelectedProfId(e.target.value)}
              >
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} — {p.especialidade}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ini">Início</Label>
              <Input
                id="ini"
                type="date"
                value={periodoInicio}
                onChange={(e) => setPeriodoInicio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fim">Fim</Label>
              <Input
                id="fim"
                type="date"
                value={periodoFim}
                onChange={(e) => setPeriodoFim(e.target.value)}
              />
            </div>
            <div className="lg:col-span-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowGerar(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGerar} disabled={submitting}>
                {submitting ? "Calculando..." : "Calcular e salvar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total em aberto</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-warning">
            {formatBRL(totalAberto)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {repasses.filter((r) => r.status === "aberto").length} repasses
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total pago</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-success">
            {formatBRL(totalPago)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {repasses.filter((r) => r.status === "pago").length} repasses
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total geral</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatBRL(totalAberto + totalPago)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {repasses.length} repasses
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : repasses.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum repasse gerado ainda.
              {podeGerar &&
                " Clique em \"Gerar repasse\" para calcular o período."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Atendimentos</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead className="text-right">Repasse</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-32"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repasses.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link
                        href={`/financeiro/repasses/${r.id}`}
                        className="block hover:text-primary"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 bg-primary/10 text-primary">
                            <AvatarFallback>
                              {initials(r.profissional.nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {r.profissional.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.profissional.especialidade}
                              {" · "}
                              {r.profissional.modalidadeContrato === "percentual"
                                ? "% sobre bruto"
                                : "aluguel fixo"}
                            </p>
                          </div>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatDate(r.periodoInicio, "dd/MM")} –{" "}
                      {formatDate(r.periodoFim, "dd/MM")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.atendimentos.length}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(r.receitaBruta))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(Number(r.valorRepasse))}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start gap-1">
                        <RepasseStatusBadge status={r.status} />
                        {r.dataPagamento && (
                          <Badge variant="outline" className="text-xs">
                            {formatDate(r.dataPagamento, "dd/MM/yyyy")}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {r.status === "aberto" && podeGerar ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handlePagar(r.id)}
                        >
                          <Send size={14} />
                          Pagar
                        </Button>
                      ) : r.status === "pago" ? (
                        <span className="flex items-center gap-1 text-xs text-success">
                          <CheckCircle2 size={14} /> Pago
                        </span>
                      ) : null}
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
