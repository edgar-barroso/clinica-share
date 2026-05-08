"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Download, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
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
  atendimentos,
  getConsultorio,
  getPaciente,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL, formatDate } from "@/lib/format";
import { usePagination } from "@/lib/use-pagination";

export default function GratuitasDescontosPage() {
  return (
    <Suspense fallback={null}>
      <GratuitasDescontosPageInner />
    </Suspense>
  );
}

function GratuitasDescontosPageInner() {
  const dataset = atendimentos
    .filter((a) => a.statusPagamento === "gratuito" && a.status === "realizado")
    .sort((a, b) => b.data.localeCompare(a.data));
  const { page, totalPages, setPage, slice } = usePagination(dataset.length);
  const visiveis = slice(dataset);

  const totalRenunciado = dataset.reduce(
    (s, a) => s + a.valorConsulta + a.procedimentos.reduce((ss, p) => ss + p.valor, 0),
    0,
  );

  return (
    <>
      <Link
        href="/relatorios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Todos os relatórios
      </Link>

      <PageHeader
        title="Consultas gratuitas e descontos (RE04)"
        description="Todas as gratuidades concedidas no período, com justificativa obrigatória (FI06)"
        actions={
          <Button variant="outline">
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Atendimentos gratuitos</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{dataset.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Receita renunciada</p>
          <p className="mt-1 text-xl font-bold text-warning tabular-nums">
            {formatBRL(totalRenunciado)}
          </p>
        </Card>
      </div>

      {dataset.length === 0 ? (
        <EmptyState
          icon={Gift}
          title="Nenhuma gratuidade no período"
          description="Gratuidades aparecem aqui sempre que um atendimento é registrado com status 'gratuito' e justificativa."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Consultório</TableHead>
                  <TableHead className="text-right">Valor renunciado</TableHead>
                  <TableHead>Justificativa</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((a) => {
                  const bruto =
                    a.valorConsulta +
                    a.procedimentos.reduce((s, p) => s + p.valor, 0);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-sm tabular-nums">
                        {formatDate(a.data, "dd/MM/yyyy")} {a.hora}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {getPaciente(a.pacienteId)?.nome}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getProfissional(a.profissionalId)?.nome}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getConsultorio(a.consultorioId)?.nome}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBRL(bruto)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.motivoDescontoOuGratuidade ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
