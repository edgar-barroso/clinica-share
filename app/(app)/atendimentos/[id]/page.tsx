import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, DoorOpen, FileText, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { EditAtendimentoButton } from "@/components/atendimento/edit-button";
import {
  atendimentos,
  getConsultorio,
  getPaciente,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL, formatDateLong } from "@/lib/format";

export default async function AtendimentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const a = atendimentos.find((x) => x.id === id);
  if (!a) notFound();

  const paciente = getPaciente(a.pacienteId);
  const prof = getProfissional(a.profissionalId);
  const cons = getConsultorio(a.consultorioId);
  const total = a.valorConsulta;

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
        title={`Atendimento #${a.id}`}
        description={`${formatDateLong(a.data)} · ${a.hora}`}
        actions={
          <EditAtendimentoButton
            atendimentoId={a.id}
            atendimentoProfissionalId={a.profissionalId}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Informações do atendimento</CardTitle>
                <div className="flex gap-2">
                  <AgendamentoStatusBadge status={a.status} />
                  <PaymentStatusBadge status={a.statusPagamento} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Calendar}
                label="Data"
                value={formatDateLong(a.data)}
              />
              <InfoRow icon={Clock} label="Horário" value={a.hora} />
              <InfoRow icon={User} label="Paciente" value={paciente?.nome ?? "—"} />
              <InfoRow
                icon={FileText}
                label="Profissional"
                value={`${prof?.nome} · ${prof?.especialidade}`}
              />
              <InfoRow icon={DoorOpen} label="Consultório" value={cons?.nome ?? "—"} />
              <InfoRow
                icon={FileText}
                label="Prontuário"
                value={
                  a.usaProntuarioExterno
                    ? "Profissional usa prontuário externo (AT04)"
                    : "ClinicaShare (AT03)"
                }
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prontuário eletrônico (AT03)</CardTitle>
            </CardHeader>
            <CardContent>
              {a.usaProntuarioExterno ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <p className="text-sm font-medium">Prontuário externo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Este profissional utiliza sistema de prontuário próprio. O
                    ClinicaShare registra apenas a ocorrência do atendimento para fins
                    financeiros (AT04).
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
                  <Badge variant="warning">Campos a definir em R2 (PEND-017)</Badge>
                  <p className="mt-3 text-sm text-muted-foreground">
                    A estrutura do prontuário eletrônico ainda será definida com o
                    Dr. Edson na próxima reunião. Esta área será preenchida com os
                    campos clínicos mínimos após validação.
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
                <span className="font-bold">{formatBRL(total)}</span>
              </div>
            </CardContent>
          </Card>

          {a.motivoDescontoOuGratuidade && (
            <Card className="border-warning/40 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-sm">Justificativa (FI06)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{a.motivoDescontoOuGratuidade}</p>
              </CardContent>
            </Card>
          )}

          {a.motivoCancelamento && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm">Motivo do cancelamento (AG06)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{a.motivoCancelamento}</p>
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
