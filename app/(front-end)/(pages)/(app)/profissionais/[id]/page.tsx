"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
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
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import { apiGetProfissional, type Profissional } from "@/lib/api/profissionais";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatPercent } from "@/lib/format";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

const DIAS = ["", "Seg", "Ter", "Qua", "Qui", "Sex"];
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
  const [p, setP] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiGetProfissional(id)
      .then((res) => setP(res.profissional))
      .catch((err) => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else toast.error(apiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="mb-6 h-12 w-full max-w-md" />
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
          <Skeleton className="h-44" />
        </div>
      </>
    );
  }

  if (notFound || !p) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Profissional não encontrado.</p>
        <Link
          href="/profissionais"
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
              {p.ativo ? (
                <Badge variant="success">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
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
              ? `Percentual ${p.percentualRepasse ? formatPercent(Number(p.percentualRepasse)) : ""}`
              : "Aluguel fixo"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {p.modalidadeContrato === "aluguel_fixo"
              ? `${formatBRL(Number(p.valorAluguelPorTurno ?? 0))} por turno`
              : "sobre receita bruta (PEND-002)"}
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Duração padrão</p>
            <ClipboardList size={16} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-bold tabular-nums">
            {p.duracaoConsultaMinutos} min
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Bloco mínimo de agenda (AG04).</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Histórico de atendimentos será exibido aqui após a Fase 4 (registro de
                atendimentos via API).
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de repasses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Repasses serão calculados e exibidos após a Fase 5 (cálculo de repasse no
                servidor — RNF-104).
              </p>
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
              {!p.turnosFixos || p.turnosFixos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem turnos fixos configurados. Edite o profissional para adicionar.
                </p>
              ) : (
                <ul className="space-y-2">
                  {p.turnosFixos.map((t) => (
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
        </aside>
      </div>
    </>
  );
}
