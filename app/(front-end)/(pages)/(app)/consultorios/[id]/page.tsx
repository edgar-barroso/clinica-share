"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ClipboardList, Pencil, Trash2, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetConsultorio,
  apiDeactivateConsultorio,
  type Consultorio,
} from "@/lib/api/consultorios";
import {
  apiListAtendimentos,
  type AtendimentoListItem,
} from "@/lib/api/atendimentos";
import {
  apiListProfissionais,
  type Profissional,
} from "@/lib/api/profissionais";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/format";

const TURNO_LABEL: Record<"manha" | "tarde" | "noite", string> = {
  manha: "Manhã",
  tarde: "Tarde",
  noite: "Noite",
};
const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function initials(name: string) {
  const parts = name
    .split(" ")
    .filter((p) => !["Dr.", "Dra.", "Sr.", "Sra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function ConsultorioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [c, setC] = useState<Consultorio | null>(null);
  const [atendimentos, setAtendimentos] = useState<AtendimentoListItem[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiGetConsultorio(id),
      apiListAtendimentos({ consultorioId: id }).catch(() => ({
        atendimentos: [] as AtendimentoListItem[],
      })),
      apiListProfissionais({ ativo: "all" }).catch(() => ({
        profissionais: [] as Profissional[],
      })),
    ])
      .then(([consRes, atsRes, profsRes]) => {
        setC(consRes.consultorio);
        setAtendimentos(atsRes.atendimentos);
        setProfissionais(
          profsRes.profissionais.filter((p) =>
            (p.turnosFixos ?? []).some((t) => t.consultorioId === id),
          ),
        );
      })
      .catch((err) => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else toast.error(apiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  // Só atendimentos `realizado` na lista de recentes — agendamentos
  // futuros, cancelamentos e faltas não fazem sentido nesse painel.
  const realizados = useMemo(
    () =>
      atendimentos
        .filter((a) => a.status === "realizado")
        .sort((a, b) =>
          `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`),
        ),
    [atendimentos],
  );
  const atendimentosRecentes = realizados.slice(0, 10);
  const totalRealizados = realizados.length;

  async function desativar() {
    if (!c) return;
    if (!confirm(`Desativar ${c.nome}?`)) return;
    try {
      await apiDeactivateConsultorio(c.id);
      toast.success("Consultório desativado");
      router.push("/consultorios");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
          <aside className="space-y-4">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </aside>
        </div>
      </div>
    );
  }

  if (notFound || !c) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Consultório não encontrado.</p>
        <Link
          href="/consultorios"
          className={`${buttonVariants({ variant: "outline" })} mt-4 inline-flex`}
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Link
        href="/consultorios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para consultórios
      </Link>

      <PageHeader
        title={c.nome}
        description={`${c.tipo} · ${c.especialidadesCompativeis.join(", ") || "—"}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/consultorios/${c.id}/editar`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil size={16} />
              Editar
            </Link>
            {c.ativo && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={desativar}
              >
                <Trash2 size={16} />
                Desativar
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-base">
                  <ClipboardList size={16} className="text-primary" />
                  Atendimentos recentes
                </span>
                {totalRealizados > 0 && (
                  <span className="text-xs font-normal text-muted-foreground tabular-nums">
                    {totalRealizados} realizado{totalRealizados === 1 ? "" : "s"}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {atendimentosRecentes.length === 0 ? (
                <EmptyState
                  icon={ClipboardList}
                  title="Nenhum atendimento registrado"
                  description="Os atendimentos realizados nesta sala aparecerão aqui."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atendimentosRecentes.map((a) => (
                      <TableRow
                        key={a.id}
                        role="link"
                        tabIndex={0}
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
                          <p className="text-sm font-medium">
                            {a.paciente.nome}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{a.profissional.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.profissional.especialidade}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users size={16} className="text-primary" />
                Profissionais vinculados
                <span className="ml-1 text-xs font-normal text-muted-foreground tabular-nums">
                  ({profissionais.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {profissionais.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum profissional vinculado"
                  description="Adicione um turno fixo neste consultório editando o cadastro do profissional."
                />
              ) : (
                <div className="divide-y divide-border">
                  {profissionais.map((p) => {
                    const turnosAqui = (p.turnosFixos ?? []).filter(
                      (t) => t.consultorioId === id,
                    );
                    return (
                      <Link
                        key={p.id}
                        href={`/profissionais/${p.id}`}
                        className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center"
                      >
                        <div className="flex flex-1 items-center gap-3">
                          <Avatar className="size-10 bg-primary/10 text-primary">
                            <AvatarFallback>{initials(p.nome)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold">
                                {p.nome}
                              </p>
                              {!p.ativo && (
                                <Badge variant="secondary">Inativo</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p.especialidade} · {p.conselho}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 sm:max-w-xs sm:justify-end">
                          {turnosAqui.map((t) => (
                            <Badge
                              key={t.id}
                              variant="outline"
                              className="text-xs"
                            >
                              {DIAS[t.diaSemana]} · {TURNO_LABEL[t.turno]}
                            </Badge>
                          ))}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              {c.ativo ? (
                <Badge variant="success">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {c.equipamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum equipamento cadastrado.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {c.equipamentos.map((eq) => (
                    <Badge key={eq} variant="outline">
                      {eq}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especialidades compatíveis</CardTitle>
            </CardHeader>
            <CardContent>
              {c.especialidadesCompativeis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma cadastrada.</p>
              ) : (
                <div className="space-y-2">
                  {c.especialidadesCompativeis.map((esp) => (
                    <div
                      key={esp}
                      className="rounded-xl bg-muted/50 px-3 py-2 text-sm"
                    >
                      {esp}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
