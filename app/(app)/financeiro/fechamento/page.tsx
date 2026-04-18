"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { getProfissional, repasses as mockRepasses } from "@/lib/mock/data";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function FechamentoPage() {
  const [repasses, setRepasses] = useState(mockRepasses);

  function marcarPago(id: string) {
    setRepasses((list) =>
      list.map((r) =>
        r.id === id ? { ...r, status: "pago" as const, dataPagamento: "2026-04-13" } : r,
      ),
    );
    toast.success("Repasse marcado como pago", {
      description: "Audit log registrado automaticamente (RNF-102).",
    });
  }

  function marcarTodosPagos() {
    setRepasses((list) =>
      list.map((r) =>
        r.status === "aberto"
          ? { ...r, status: "pago" as const, dataPagamento: "2026-04-13" }
          : r,
      ),
    );
    toast.success("Semana fechada", {
      description: "Todos os repasses em aberto foram marcados como pagos.",
    });
  }

  const abertos = repasses.filter((r) => r.status === "aberto");
  const pagos = repasses.filter((r) => r.status === "pago");
  const totalBruto = repasses.reduce((s, r) => s + r.receitaBruta, 0);
  const totalRepasse = repasses.reduce((s, r) => s + r.valorRepasse, 0);

  return (
    <>
      <PageHeader
        title="Fechamento semanal"
        description="Prestação de contas · 06 a 12 de abril de 2026 (FI07)"
        actions={
          <>
            <Button variant="outline">
              <Download size={16} />
              Exportar PDF
            </Button>
            <Button onClick={marcarTodosPagos} disabled={abertos.length === 0}>
              <CheckCircle2 size={16} />
              Marcar todos como pagos
            </Button>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Receita bruta consolidada</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{formatBRL(totalBruto)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total de repasses devidos</p>
          <p className="mt-1 text-2xl font-bold text-primary tabular-nums">
            {formatBRL(totalRepasse)}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Margem líquida estimada</p>
          <p className="mt-1 text-2xl font-bold text-success tabular-nums">
            {formatBRL(totalBruto - totalRepasse)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Receita que permanece com a clínica
          </p>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Repasses da semana</CardTitle>
          <Badge variant={abertos.length > 0 ? "warning" : "success"}>
            {abertos.length === 0
              ? "Semana fechada"
              : `${abertos.length} em aberto · ${pagos.length} pagos`}
          </Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Modalidade</TableHead>
                <TableHead className="text-right">Consultas</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead className="text-right">Repasse</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repasses.map((r) => {
                const prof = getProfissional(r.profissionalId)!;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 bg-primary/10 text-primary">
                          <AvatarFallback>{initials(prof.nome)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{prof.nome}</p>
                          <p className="text-xs text-muted-foreground">{prof.especialidade}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {prof.modalidadeContrato === "percentual" ? (
                        <span className="text-sm">
                          {formatPercent(prof.percentualRepasse ?? 0)} sobre bruto
                        </span>
                      ) : (
                        <span className="text-sm">
                          {formatBRL(prof.valorAluguelPorTurno ?? 0)} por turno
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
                        <RepasseStatusBadge status={r.status} />
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
                          variant="outline"
                          onClick={() => marcarPago(r.id)}
                        >
                          <Send size={14} />
                          Pagar
                        </Button>
                      ) : (
                        <span className="text-xs text-success flex items-center gap-1">
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
    </>
  );
}
