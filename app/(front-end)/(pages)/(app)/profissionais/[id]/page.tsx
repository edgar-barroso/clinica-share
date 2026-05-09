"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Mail,
  Pencil,
  Phone,
  Wallet,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
  RepasseStatusBadge,
} from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetProfissional,
  type Profissional,
} from "@/lib/api/profissionais";
import {
  apiListAtendimentos,
  type AtendimentoListItem,
} from "@/lib/api/atendimentos";
import {
  apiListRepasses,
  type RepasseListItem,
} from "@/lib/api/repasses";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TURNO_LABEL: Record<string, string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};

export default function ProfissionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [prof, setProf] = useState<Profissional | null>(null);
  const [atendimentos, setAtendimentos] = useState<AtendimentoListItem[]>([]);
  const [repasses, setRepasses] = useState<RepasseListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, atsRes, repRes] = await Promise.all([
        apiGetProfissional(id),
        apiListAtendimentos({ profissionalId: id }),
        apiListRepasses({ profissionalId: id }),
      ]);
      setProf(profRes.profissional);
      setAtendimentos(atsRes.atendimentos);
      setRepasses(repRes.repasses);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading || !prof) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
          <aside className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </aside>
        </div>
      </div>
    );
  }

  const ats = [...atendimentos].sort((a, b) =>
    `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`),
  );
  const realizados = ats.filter((a) => a.status === "realizado").length;
  const receitaBruta = repasses.reduce((s, r) => s + Number(r.receitaBruta), 0);
  const totalRepasse = repasses.reduce((s, r) => s + Number(r.valorRepasse), 0);

  return (
    <>
      <Link
        href="/profissionais"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para profissionais
      </Link>

      <PageHeader
        title={prof.nome}
        description={`${prof.especialidade} · ${prof.conselho}`}
        actions={
          <Link
            href={`/profissionais/${prof.id}/editar`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil size={16} />
            Editar
          </Link>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar className="size-14 bg-primary/10 text-lg text-primary">
              <AvatarFallback>{initials(prof.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{prof.nome}</p>
              {prof.ativo ? (
                <Badge variant="success">Ativo</Badge>
              ) : (
                <Badge>Inativo</Badge>
              )}
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail size={14} /> {prof.email}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} /> {prof.telefone}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Contrato vigente</p>
            <Wallet size={16} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-lg font-semibold">
            {prof.modalidadeContrato === "percentual"
              ? `Percentual ${formatPercent(Number(prof.percentualRepasse ?? 0))}`
              : "Aluguel fixo"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {prof.modalidadeContrato === "aluguel_fixo"
              ? `${formatBRL(Number(prof.valorAluguelPorTurno ?? 0))} por turno`
              : "sobre receita bruta"}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Atividade total</p>
            <ClipboardList size={16} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {realizados} atendimentos realizados
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bruto: {formatBRL(receitaBruta)} · Repasse:{" "}
            {formatBRL(totalRepasse)}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {ats.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Sem atendimentos registrados.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Consultório</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ats.slice(0, 10).map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm tabular-nums">
                          {formatDate(a.data, "dd/MM")} {a.hora}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {a.paciente.nome}
                        </TableCell>
                        <TableCell className="text-sm">
                          {a.consultorio.nome}
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

          <Card>
            <CardHeader>
              <CardTitle>Histórico de repasses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {repasses.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Nenhum repasse gerado ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Período</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Repasse</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {repasses.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm tabular-nums">
                          {formatDate(r.periodoInicio, "dd/MM")} –{" "}
                          {formatDate(r.periodoFim, "dd/MM")}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatBRL(Number(r.receitaBruta))}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatBRL(Number(r.valorRepasse))}
                        </TableCell>
                        <TableCell>
                          <RepasseStatusBadge status={r.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                Turnos fixos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!prof.turnosFixos || prof.turnosFixos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem turnos fixos configurados.
                </p>
              ) : (
                <ul className="space-y-2">
                  {prof.turnosFixos.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {DIAS[t.diaSemana]} · {TURNO_LABEL[t.turno]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {t.consultorio.nome}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Valor da consulta</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {formatBRL(Number(prof.valorConsultaBase))}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Aparece pro paciente ao agendar; ajustável na finalização.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Duração padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {prof.duracaoConsultaMinutos} min
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Define o bloco padrão na agenda.
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
