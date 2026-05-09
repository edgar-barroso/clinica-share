"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Calendar,
  CalendarHeart,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  apiGetPaciente,
  type Paciente,
} from "@/lib/api/pacientes";
import {
  apiListAgendamentos,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

function initials(name: string) {
  const parts = name
    .split(" ")
    .filter((p) => !["Dr.", "Dra.", "Sr.", "Sra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function calcIdade(dataNascIso: string): number | null {
  const [y, m, d] = dataNascIso.slice(0, 10).split("-").map(Number);
  if (!y) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - y;
  const mesDiff = hoje.getMonth() + 1 - m;
  if (mesDiff < 0 || (mesDiff === 0 && hoje.getDate() < d)) idade -= 1;
  return idade;
}

const SEXO_LABEL: Record<string, string> = {
  M: "Masculino",
  F: "Feminino",
  outro: "Prefere não informar",
};

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { role } = useCurrentUser();
  const podeEditar = role === "admin" || role === "atendente";

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [atendimentos, setAtendimentos] = useState<AgendamentoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [pacRes, atRes] = await Promise.all([
        apiGetPaciente(id),
        apiListAgendamentos({ pacienteId: id }),
      ]);
      setPaciente(pacRes.paciente);
      setAtendimentos(atRes.agendamentos);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Paciente não encontrado.
      </p>
    );
  }

  const idade = paciente.dataNascimento
    ? calcIdade(paciente.dataNascimento)
    : null;
  const proximas = atendimentos
    .filter((a) => a.status === "agendado" || a.status === "em_atendimento")
    .sort((a, b) =>
      `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`),
    );
  const historico = atendimentos
    .filter((a) => a.status === "realizado" || a.status === "cancelado")
    .sort((a, b) =>
      `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`),
    );

  return (
    <>
      <Link
        href="/pacientes"
        className="mb-4 inline-block text-sm text-muted-foreground hover:text-foreground"
      >
        ← Voltar para a lista
      </Link>

      <PageHeader
        title={paciente.nome}
        description="Cadastro completo, plano e histórico de consultas"
        actions={
          podeEditar && (
            <Link
              href={`/pacientes/${paciente.id}/editar`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil size={14} />
              Editar
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User size={16} className="text-primary" />
                Identidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="size-16 bg-primary/10 text-primary">
                  <AvatarFallback className="text-lg">
                    {initials(paciente.nome)}
                  </AvatarFallback>
                </Avatar>
                <dl className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                  <Field label="Nome" value={paciente.nome} />
                  <Field
                    label="Idade"
                    value={idade !== null ? `${idade} anos` : "—"}
                  />
                  <Field label="CPF" value={paciente.cpf ?? "—"} mono />
                  <Field
                    label="Data de nascimento"
                    value={
                      paciente.dataNascimento
                        ? formatDate(paciente.dataNascimento, "dd/MM/yyyy")
                        : "—"
                    }
                  />
                  <Field
                    label="Sexo"
                    value={
                      paciente.sexo ? SEXO_LABEL[paciente.sexo] : "—"
                    }
                  />
                  <Field
                    label="Cadastro"
                    value={formatDate(paciente.createdAt, "dd/MM/yyyy")}
                  />
                </dl>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Mail size={16} className="text-primary" />
                Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="E-mail" value={paciente.email} />
                <Field
                  label="Telefone"
                  value={paciente.telefone}
                  icon={<Phone size={12} />}
                />
              </dl>
            </CardContent>
          </Card>

          {paciente.endereco && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin size={16} className="text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {paciente.endereco.rua}, {paciente.endereco.numero}
                </p>
                <p className="text-sm text-muted-foreground">
                  {paciente.endereco.cidade}/{paciente.endereco.uf} ·{" "}
                  {paciente.endereco.cep}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarHeart size={16} className="text-primary" />
                Próximas consultas
              </CardTitle>
              <CardDescription>
                {proximas.length === 0
                  ? "Nenhuma consulta agendada"
                  : `${proximas.length} agendada${proximas.length === 1 ? "" : "s"}`}
              </CardDescription>
            </CardHeader>
            {proximas.length > 0 && (
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Consultório</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {proximas.slice(0, 5).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap">
                          <div className="text-sm font-medium">
                            {formatDate(a.data, "dd/MM/yyyy")}
                          </div>
                          <div className="text-xs text-muted-foreground tabular-nums">
                            {a.hora}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{a.profissional.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.profissional.especialidade}
                          </p>
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.consultorio.nome}
                        </TableCell>
                        <TableCell>
                          <AgendamentoStatusBadge status={a.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            )}
          </Card>

          {historico.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar size={16} className="text-primary" />
                  Histórico de consultas
                </CardTitle>
                <CardDescription>
                  {historico.length} consulta
                  {historico.length === 1 ? "" : "s"} (realizada
                  {historico.length === 1 ? "" : "s"} ou cancelada
                  {historico.length === 1 ? "" : "s"})
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historico.slice(0, 10).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap text-sm tabular-nums">
                          {formatDate(a.data, "dd/MM/yy")}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{a.profissional.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.profissional.especialidade}
                          </p>
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
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
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck size={16} className="text-primary" />
                Plano
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paciente.plano?.temPlano ? (
                <div className="space-y-2">
                  <Badge variant="outline" className="text-xs">
                    Convênio
                  </Badge>
                  <p className="text-sm font-medium">
                    {paciente.plano.operadora ?? "—"}
                  </p>
                  {paciente.plano.numeroCarteirinha && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      Carteirinha {paciente.plano.numeroCarteirinha}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Atendimento particular
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2 text-sm">
                <Row label="Total agendadas" value={String(proximas.length)} />
                <Row
                  label="Realizadas"
                  value={String(
                    historico.filter((a) => a.status === "realizado").length,
                  )}
                />
                <Row
                  label="Canceladas"
                  value={String(
                    historico.filter((a) => a.status === "cancelado").length,
                  )}
                />
                <Row
                  label="Última consulta"
                  value={
                    historico[0]
                      ? formatDateLong(historico[0].data)
                      : "—"
                  }
                />
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function Field({
  label,
  value,
  mono,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd
        className={`mt-0.5 flex items-center gap-1.5 text-sm ${mono ? "tabular-nums" : ""}`}
      >
        {icon}
        {value}
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
