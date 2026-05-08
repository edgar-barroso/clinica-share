"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Calendar, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
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
  apiListAgendamentos,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/format";

export default function MinhasConsultasPage() {
  const [agendamentos, setAgendamentos] = useState<AgendamentoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { agendamentos } = await apiListAgendamentos();
      setAgendamentos(
        agendamentos.sort((a, b) =>
          `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`),
        ),
      );
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <>
      <PageHeader
        title="Minhas consultas"
        description="Histórico completo das suas consultas"
        actions={
          <Link href="/p/agendar" className={buttonVariants()}>
            <Plus size={16} />
            Agendar
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : agendamentos.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Nenhuma consulta ainda"
              description="Quando você agendar, suas consultas aparecerão aqui."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Consultório</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agendamentos.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatDate(a.data, "dd/MM")}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {a.hora}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {a.profissional.nome}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.profissional.especialidade}
                      </p>
                    </TableCell>
                    <TableCell>{a.consultorio.nome}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(a.valorConsulta))}
                    </TableCell>
                    <TableCell>
                      <AgendamentoStatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={a.statusPagamento} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/p/consultas/${a.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Ver
                      </Link>
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
