"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  FileText,
  Pencil,
  Play,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiFinalizarAtendimento,
  apiGetAtendimento,
  apiIniciarAtendimento,
  type AtendimentoDetail,
  type StatusPagamento,
} from "@/lib/api/atendimentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDateLong } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

interface ProntuarioForm {
  anamnese: string;
  evolucao: string;
  conduta: string;
  retorno: string;
}

const PRONTUARIO_VAZIO: ProntuarioForm = {
  anamnese: "",
  evolucao: "",
  conduta: "",
  retorno: "",
};

export default function AtendimentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role, profissionalId } = useCurrentUser();
  const [atendimento, setAtendimento] = useState<AtendimentoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFinalize, setShowFinalize] = useState(false);
  const [valor, setValor] = useState("");
  const [statusPag, setStatusPag] = useState<StatusPagamento>("pago");
  const [motivoGratuidade, setMotivoGratuidade] = useState("");
  const [prontuario, setProntuario] = useState<ProntuarioForm>(PRONTUARIO_VAZIO);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { atendimento } = await apiGetAtendimento(id);
      setAtendimento(atendimento);
      setValor(String(atendimento.valorConsulta));
      setStatusPag(atendimento.statusPagamento);
      const p = atendimento.prontuarioInterno as ProntuarioForm | null;
      if (p && typeof p === "object") {
        setProntuario({
          anamnese: p.anamnese ?? "",
          evolucao: p.evolucao ?? "",
          conduta: p.conduta ?? "",
          retorno: p.retorno ?? "",
        });
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading || !atendimento) {
    return <AtendimentoDetailSkeleton />;
  }

  const isProfissionalDono =
    role === "profissional" && profissionalId === atendimento.profissionalId;
  const podeIniciar =
    atendimento.status === "agendado" &&
    (role === "admin" || role === "auxiliar" || isProfissionalDono);
  const podeFinalizar =
    atendimento.status === "em_atendimento" &&
    (role === "admin" || role === "auxiliar" || isProfissionalDono);
  const podeEditar =
    atendimento.status === "realizado" &&
    (role === "admin" || role === "auxiliar");

  async function handleIniciar() {
    setSubmitting(true);
    try {
      await apiIniciarAtendimento(id);
      toast.success("Atendimento iniciado");
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinalizar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (statusPag === "gratuito" && motivoGratuidade.trim().length < 3) {
      toast.warning("Motivo é obrigatório para atendimento gratuito");
      return;
    }
    setSubmitting(true);
    try {
      await apiFinalizarAtendimento(id, {
        valorConsulta: Number(valor) || 0,
        statusPagamento: statusPag,
        motivoDescontoOuGratuidade:
          statusPag === "gratuito" ? motivoGratuidade.trim() : undefined,
        prontuarioInterno: prontuario,
      });
      toast.success("Atendimento finalizado");
      setShowFinalize(false);
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link
        href="/atendimentos"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para atendimentos
      </Link>

      <PageHeader
        title={`Atendimento #${atendimento.id.slice(0, 8)}`}
        description={`${formatDateLong(atendimento.data)} · ${atendimento.hora}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {podeIniciar && (
              <Button onClick={handleIniciar} disabled={submitting}>
                <Play size={14} />
                Iniciar atendimento
              </Button>
            )}
            {podeFinalizar && !showFinalize && (
              <Button onClick={() => setShowFinalize(true)} disabled={submitting}>
                <CheckCircle2 size={14} />
                Finalizar e registrar
              </Button>
            )}
            {podeEditar && (
              <Link
                href={`/atendimentos/${id}/editar`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Pencil size={14} />
                Editar
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Informações do atendimento</CardTitle>
                <div className="flex gap-2">
                  <AgendamentoStatusBadge status={atendimento.status} />
                  <PaymentStatusBadge status={atendimento.statusPagamento} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Calendar}
                label="Data"
                value={formatDateLong(atendimento.data)}
              />
              <InfoRow icon={Clock} label="Horário" value={atendimento.hora} />
              <InfoRow
                icon={User}
                label="Paciente"
                value={atendimento.paciente.nome}
              />
              <InfoRow
                icon={FileText}
                label="Profissional"
                value={`${atendimento.profissional.nome} · ${atendimento.profissional.especialidade}`}
              />
              <InfoRow
                icon={DoorOpen}
                label="Consultório"
                value={atendimento.consultorio.nome}
              />
            </CardContent>
          </Card>

          {showFinalize && (
            <Card>
              <CardHeader>
                <CardTitle>Finalizar atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFinalizar} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="valor">Valor cobrado (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      min="0"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <p className="mb-2 text-sm font-medium">Pagamento</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(["pago", "pendente", "gratuito"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatusPag(s)}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                            statusPag === s
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  {statusPag === "gratuito" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="motivoGratuidade">
                        Justificativa da gratuidade                      </Label>
                      <Input
                        id="motivoGratuidade"
                        value={motivoGratuidade}
                        onChange={(e) => setMotivoGratuidade(e.target.value)}
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-sm font-medium">Prontuário</p>
                    <ProntuarioField
                      label="Anamnese"
                      value={prontuario.anamnese}
                      onChange={(v) =>
                        setProntuario((p) => ({ ...p, anamnese: v }))
                      }
                    />
                    <ProntuarioField
                      label="Evolução"
                      value={prontuario.evolucao}
                      onChange={(v) =>
                        setProntuario((p) => ({ ...p, evolucao: v }))
                      }
                    />
                    <ProntuarioField
                      label="Conduta"
                      value={prontuario.conduta}
                      onChange={(v) =>
                        setProntuario((p) => ({ ...p, conduta: v }))
                      }
                    />
                    <ProntuarioField
                      label="Retorno"
                      value={prontuario.retorno}
                      onChange={(v) =>
                        setProntuario((p) => ({ ...p, retorno: v }))
                      }
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowFinalize(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      <CheckCircle2 size={14} />
                      {submitting ? "Salvando..." : "Confirmar finalização"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Prontuário registrado</CardTitle>
            </CardHeader>
            <CardContent>
              {atendimento.prontuarioInterno &&
              typeof atendimento.prontuarioInterno === "object" ? (
                <div className="space-y-3 text-sm">
                  {Object.entries(
                    atendimento.prontuarioInterno as Record<string, unknown>,
                  )
                    .filter(([, v]) => typeof v === "string" && v.length > 0)
                    .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {k}
                        </p>
                        <p className="mt-0.5">{String(v)}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
                  <Badge variant="warning">
                    Prontuário ainda não preenchido
                  </Badge>
                  <p className="mt-3 text-sm text-muted-foreground">
                    O prontuário será preenchido na finalização do atendimento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Valores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between text-base">
                <span className="font-semibold">Valor da consulta</span>
                <span className="font-bold">
                  {formatBRL(Number(atendimento.valorConsulta))}
                </span>
              </div>
            </CardContent>
          </Card>

          {atendimento.motivoDescontoOuGratuidade && (
            <Card className="border-warning/40 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-sm">Justificativa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {atendimento.motivoDescontoOuGratuidade}
                </p>
              </CardContent>
            </Card>
          )}

          {atendimento.motivoCancelamento && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm">
                  Motivo do cancelamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{atendimento.motivoCancelamento}</p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-muted p-2 text-muted-foreground">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function AtendimentoDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-56" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ProntuarioField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
