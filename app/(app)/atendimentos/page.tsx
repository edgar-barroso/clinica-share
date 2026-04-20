"use client";

import Link from "next/link";
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
  atendimentos,
  getConsultorio,
  getPaciente,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL, formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

export default function AtendimentosPage() {
  const { role, profissionalId } = useCurrentUser();
  const isProfissional = role === "profissional" && !!profissionalId;
  const filtrados = isProfissional
    ? atendimentos.filter((a) => a.profissionalId === profissionalId)
    : atendimentos;
  const ordenados = [...filtrados].sort((a, b) =>
    `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`),
  );

  return (
    <>
      <PageHeader
        title={isProfissional ? "Meus atendimentos" : "Atendimentos"}
        description={
          isProfissional
            ? "Consultas e procedimentos realizados por você"
            : "Registro de consultas e procedimentos realizados na clínica"
        }
        actions={
          <Link href="/atendimentos/novo" className={buttonVariants()}>
            <Plus size={16} />
            Registrar atendimento
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Consultório</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenados.map((a) => {
                const paciente = getPaciente(a.pacienteId);
                const prof = getProfissional(a.profissionalId);
                const cons = getConsultorio(a.consultorioId);
                const procedimentosTotal = a.procedimentos.reduce(
                  (s, p) => s + p.valor,
                  0,
                );
                const bruto = a.valorConsulta + procedimentosTotal;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap">
                      <Link
                        href={`/atendimentos/${a.id}`}
                        className="block hover:text-primary"
                      >
                        <div className="text-sm font-medium">{formatDate(a.data, "dd/MM")}</div>
                        <div className="text-xs text-muted-foreground tabular-nums">{a.hora}</div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{paciente?.nome}</p>
                      <p className="text-xs text-muted-foreground">{paciente?.telefone}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{prof?.nome}</p>
                      <p className="text-xs text-muted-foreground">{prof?.especialidade}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{cons?.nome}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(bruto)}
                      {a.procedimentos.length > 0 && (
                        <div className="text-xs font-normal text-muted-foreground">
                          inclui {a.procedimentos.length} proc.
                        </div>
                      )}
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
        </CardContent>
      </Card>
    </>
  );
}
