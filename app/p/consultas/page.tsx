"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
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
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  atendimentos,
  getConsultorio,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/current-user";
import { usePagination } from "@/lib/use-pagination";

export default function MinhasConsultasPage() {
  return (
    <Suspense fallback={null}>
      <MinhasConsultasPageInner />
    </Suspense>
  );
}

function MinhasConsultasPageInner() {
  const router = useRouter();
  const { pacienteId } = useCurrentUser();
  const [tab, setTab] = useState<"futuras" | "historico">("futuras");

  useEffect(() => {
    if (!pacienteId) router.replace("/entrar");
  }, [pacienteId, router]);

  const todas = pacienteId
    ? atendimentos.filter((a) => a.pacienteId === pacienteId)
    : [];
  const futuras = todas
    .filter((a) => a.status === "agendado" || a.status === "em_atendimento")
    .sort((a, b) => `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`));
  const historico = todas
    .filter((a) => a.status === "realizado" || a.status === "cancelado")
    .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`));

  const lista = tab === "futuras" ? futuras : historico;
  const { page, totalPages, setPage, slice } = usePagination(lista.length);
  const visiveis = slice(lista);

  function handleTabChange(novaTab: "futuras" | "historico") {
    setTab(novaTab);
    setPage(1);
  }

  if (!pacienteId) return null;

  return (
    <>
      <PageHeader
        title="Minhas consultas"
        description="Acompanhe consultas agendadas e seu histórico completo"
        actions={
          <Link href="/p/agendar" className={buttonVariants()}>
            <Plus size={16} />
            Agendar nova
          </Link>
        }
      />

      <div className="mb-6 inline-flex rounded-xl border border-border bg-card p-1 text-sm">
        <button
          type="button"
          onClick={() => handleTabChange("futuras")}
          className={cn(
            "rounded-lg px-4 py-1.5 font-medium transition-colors",
            tab === "futuras"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Próximas{futuras.length > 0 && ` · ${futuras.length}`}
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("historico")}
          className={cn(
            "rounded-lg px-4 py-1.5 font-medium transition-colors",
            tab === "historico"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Histórico{historico.length > 0 && ` · ${historico.length}`}
        </button>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={
            tab === "futuras"
              ? "Nenhuma consulta agendada"
              : "Nenhuma consulta no histórico"
          }
          description={
            tab === "futuras"
              ? "Agende sua próxima visita com um especialista."
              : "Suas consultas realizadas aparecerão aqui."
          }
          action={
            tab === "futuras" ? (
              <Link href="/p/agendar" className={buttonVariants()}>
                <Plus size={14} />
                Agendar consulta
              </Link>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / Hora</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Consultório</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((a) => {
                  const prof = getProfissional(a.profissionalId);
                  const cons = getConsultorio(a.consultorioId);
                  const bruto =
                    a.valorConsulta +
                    a.procedimentos.reduce((s, p) => s + p.valor, 0);
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="whitespace-nowrap">
                        <Link
                          href={`/p/consultas/${a.id}`}
                          className="block hover:text-primary"
                        >
                          <div className="text-sm font-medium">
                            {formatDate(a.data, "dd/MM/yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {a.hora}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{prof?.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {prof?.especialidade}
                        </p>
                      </TableCell>
                      <TableCell className="text-sm">{cons?.nome}</TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBRL(bruto)}
                      </TableCell>
                      <TableCell>
                        <AgendamentoStatusBadge status={a.status} />
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={a.statusPagamento} />
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
