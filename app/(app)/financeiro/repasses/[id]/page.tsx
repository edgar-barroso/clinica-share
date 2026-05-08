"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle2, Send } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { RepasseStatusBadge } from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  atendimentos,
  getPaciente,
  getProfissional,
  periodoReferencia,
  repasses as mockRepasses,
} from "@/lib/mock/data";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function RepasseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const original = mockRepasses.find((r) => r.id === id);
  if (!original) notFound();
  const router = useRouter();
  const [repasse, setRepasse] = useState(original);
  const prof = getProfissional(repasse.profissionalId)!;
  const atsDoRepasse = atendimentos.filter((a) =>
    repasse.atendimentosIds.includes(a.id),
  );

  function marcarPago() {
    setRepasse((r) => ({
      ...r,
      status: "pago",
      dataPagamento: periodoReferencia.dataPagamento,
    }));
    toast.success("Repasse marcado como pago", {
      description:
        "Audit log registrado (RNF-102): quem, quando, entidade, campo, valor antes/depois.",
    });
  }

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
        title={`Repasse #${repasse.id}`}
        description={`${formatDate(repasse.periodoInicio, "dd/MM")} – ${formatDate(repasse.periodoFim, "dd/MM")} · ${prof.nome}`}
        actions={
          repasse.status === "aberto" ? (
            <Button onClick={marcarPago}>
              <Send size={16} />
              Marcar como pago
            </Button>
          ) : (
            <Link
              href="/financeiro/repasses"
              className={buttonVariants({ variant: "outline" })}
            >
              Ver todos os repasses
            </Link>
          )
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Receita bruta</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatBRL(repasse.receitaBruta)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Modalidade</p>
          <p className="mt-1 text-sm font-medium">
            {prof.modalidadeContrato === "percentual"
              ? `Percentual ${formatPercent(prof.percentualRepasse ?? 0)}`
              : `Aluguel ${formatBRL(prof.valorAluguelPorTurno ?? 0)}/turno`}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Repasse devido</p>
          <p className="mt-1 text-xl font-bold text-primary tabular-nums">
            {formatBRL(repasse.valorRepasse)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <div className="mt-2">
            <RepasseStatusBadge status={repasse.status} />
            {repasse.dataPagamento && (
              <p className="mt-1 text-xs text-muted-foreground">
                Pago em {formatDate(repasse.dataPagamento, "dd/MM/yyyy")}
              </p>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos incluídos no cálculo ({atsDoRepasse.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Paciente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {atsDoRepasse.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap text-sm tabular-nums">
                        {formatDate(a.data, "dd/MM")} {a.hora}
                      </TableCell>
                      <TableCell className="text-sm">{getPaciente(a.pacienteId)?.nome}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBRL(a.valorConsulta)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <aside>
          <Card>
            <CardHeader>
              <CardTitle>Profissional</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/profissionais/${prof.id}`}
                className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-muted"
              >
                <Avatar className="size-11 bg-primary/10 text-primary">
                  <AvatarFallback>{initials(prof.nome)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{prof.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {prof.especialidade} · {prof.conselho}
                  </p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {repasse.status === "pago" && (
            <Card className="mt-4 border-success/40 bg-success/5">
              <CardContent className="flex items-start gap-3 p-4">
                <CheckCircle2 size={18} className="mt-0.5 text-success" />
                <div>
                  <p className="text-sm font-semibold">Repasse quitado</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este repasse não pode mais ser alterado. Qualquer ajuste gera novo
                    registro em /auditoria.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}
