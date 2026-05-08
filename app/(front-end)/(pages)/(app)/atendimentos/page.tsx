"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  apiListAtendimentos,
  type AtendimentoListItem,
} from "@/lib/api/atendimentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

export default function AtendimentosPage() {
  const router = useRouter();
  const { role } = useCurrentUser();
  const isProfissional = role === "profissional";
  const [atendimentos, setAtendimentos] = useState<AtendimentoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { atendimentos } = await apiListAtendimentos();
      setAtendimentos(atendimentos);
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
        title={isProfissional ? "Meus atendimentos" : "Atendimentos"}
        description={
          isProfissional
            ? "Consultas realizadas por você"
            : "Registro de consultas na clínica"
        }
        actions={
          (role === "admin" || role === "auxiliar" || isProfissional) && (
            <Link href="/atendimentos/novo" className={buttonVariants()}>
              <Plus size={16} />
              Registrar atendimento
            </Link>
          )
        }
      />

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : atendimentos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum atendimento registrado ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  {!isProfissional && <TableHead>Profissional</TableHead>}
                  <TableHead>Consultório</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atendimentos.map((a) => (
                  <TableRow
                    key={a.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Ver atendimento de ${a.paciente.nome}`}
                    onClick={() => router.push(`/atendimentos/${a.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/atendimentos/${a.id}`);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {formatDate(a.data, "dd/MM")}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {a.hora}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{a.paciente.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.paciente.telefone}
                      </p>
                    </TableCell>
                    {!isProfissional && (
                      <TableCell>
                        <p className="text-sm font-medium">
                          {a.profissional.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.profissional.especialidade}
                        </p>
                      </TableCell>
                    )}
                    <TableCell>
                      <p className="text-sm">{a.consultorio.nome}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(Number(a.valorConsulta))}
                    </TableCell>
                    <TableCell>
                      <AgendamentoStatusBadge status={a.status} />
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
