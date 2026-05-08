"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarClock,
  ChevronRight,
  Plus,
  Stethoscope,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useCurrentUser } from "@/lib/current-user";

export default function PortalHomePage() {
  const { userNome, loading: userLoading } = useCurrentUser();
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

  const proximas = agendamentos.filter(
    (a) => a.status === "agendado" || a.status === "em_atendimento",
  );
  const recentes = agendamentos.filter((a) => a.status === "realizado").slice(0, 5);

  if (userLoading || loading) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando…
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title={`Olá, ${userNome.split(" ")[0]}`}
        description="Suas consultas e cadastro"
        actions={
          <Link href="/p/agendar" className={buttonVariants()}>
            <Plus size={16} />
            Agendar consulta
          </Link>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock size={18} className="text-primary" />
            Próximas consultas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {proximas.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Você não tem consultas agendadas.{" "}
              <Link href="/p/agendar" className="text-primary hover:underline">
                Agendar agora →
              </Link>
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Consultório</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {proximas.map((a) => (
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
                    <TableCell>
                      <AgendamentoStatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/p/consultas/${a.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        <ChevronRight size={14} />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Stethoscope size={18} className="text-primary" />
            Histórico recente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentes.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhuma consulta realizada ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentes.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">
                      {formatDate(a.data, "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {a.profissional.nome}
                      </p>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(Number(a.valorConsulta))}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={a.statusPagamento} />
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
