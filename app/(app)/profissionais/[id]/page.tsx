import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Mail,
  Pencil,
  Phone,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  repasses,
} from "@/lib/mock/data";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
  RepasseStatusBadge,
} from "@/components/financial/status-badge";

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

export default async function ProfissionalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = getProfissional(id);
  if (!p) notFound();

  const ats = atendimentos
    .filter((a) => a.profissionalId === p.id)
    .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`));
  const repassesDele = repasses.filter((r) => r.profissionalId === p.id);
  const receitaBruta = repassesDele.reduce((s, r) => s + r.receitaBruta, 0);
  const totalRepasse = repassesDele.reduce((s, r) => s + r.valorRepasse, 0);

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
        title={p.nome}
        description={`${p.especialidade} · ${p.conselho}`}
        actions={
          <Link
            href={`/profissionais/${p.id}/editar`}
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
              <AvatarFallback>{initials(p.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{p.nome}</p>
              {p.ativo ? <Badge variant="success">Ativo</Badge> : <Badge>Inativo</Badge>}
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail size={14} /> {p.email}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} /> {p.telefone}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Contrato vigente</p>
            <Wallet size={16} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-lg font-semibold">
            {p.modalidadeContrato === "percentual"
              ? `Percentual ${formatPercent(p.percentualRepasse ?? 0)}`
              : `Aluguel fixo`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {p.modalidadeContrato === "aluguel-fixo"
              ? `${formatBRL(p.valorAluguelPorTurno ?? 0)} por turno`
              : "sobre receita bruta"}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Atividade na semana</p>
            <ClipboardList size={16} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-lg font-semibold tabular-nums">
            {ats.filter((a) => a.status === "realizado").length} atendimentos
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Bruto: {formatBRL(receitaBruta)} · Repasse: {formatBRL(totalRepasse)}
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
                  {ats.slice(0, 10).map((a) => {
                    const bruto =
                      a.valorConsulta +
                      a.procedimentos.reduce((s, pr) => s + pr.valor, 0);
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="text-sm tabular-nums">
                          {formatDate(a.data, "dd/MM")} {a.hora}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {getPaciente(a.pacienteId)?.nome}
                        </TableCell>
                        <TableCell className="text-sm">
                          {getConsultorio(a.consultorioId)?.nome}
                        </TableCell>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de repasses</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
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
                  {repassesDele.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm tabular-nums">
                        {formatDate(r.periodoInicio, "dd/MM")} –{" "}
                        {formatDate(r.periodoFim, "dd/MM")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatBRL(r.receitaBruta)}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatBRL(r.valorRepasse)}
                      </TableCell>
                      <TableCell>
                        <RepasseStatusBadge status={r.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              {p.turnosFixos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem turnos fixos configurados.
                </p>
              ) : (
                <ul className="space-y-2">
                  {p.turnosFixos.map((t, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">
                          {DIAS[t.dia]} · {TURNO_LABEL[t.turno]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getConsultorio(t.consultorioId)?.nome}
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
              <CardTitle>Duração padrão</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {p.duracaoConsultaMinutos} min
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Define o bloco mínimo de agenda (AG04).
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
