"use client";

import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, Ban, Download } from "lucide-react";
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
import { formatDate } from "@/lib/format";
import { usePagination } from "@/lib/use-pagination";

export default function CancelamentosPage() {
  return (
    <Suspense fallback={null}>
      <CancelamentosPageInner />
    </Suspense>
  );
}

function CancelamentosPageInner() {
  const dataset = atendimentos
    .filter((a) => a.status === "cancelado")
    .sort((a, b) => b.data.localeCompare(a.data));
  const { page, totalPages, setPage, slice } = usePagination(dataset.length);
  const visiveis = slice(dataset);

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
        title="Cancelamentos com motivo (RE05)"
        description="Atendimentos cancelados no período com motivo registrado pelo paciente ou atendente"
        actions={
          <Button variant="outline">
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />

      {dataset.length === 0 ? (
        <EmptyState
          icon={Ban}
          title="Nenhum cancelamento no período"
          description="Ótima notícia — a semana foi inteira sem cancelamentos."
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data do atendimento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Consultório</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((a) => (
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
                    <TableCell className="text-sm text-muted-foreground">
                      {a.motivoCancelamento ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
