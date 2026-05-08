"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CalendarClock,
  CheckCircle2,
  Clock,
  MapPin,
  Stethoscope,
  X,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layouts/page-header";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import {
  atendimentos,
  getConsultorio,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL, formatDateLong } from "@/lib/format";

export default function ConsultaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const original = atendimentos.find((a) => a.id === id);
  if (!original) notFound();
  const router = useRouter();
  const [consulta, setConsulta] = useState(original);
  const [showCancelar, setShowCancelar] = useState(false);
  const [motivo, setMotivo] = useState("");

  const prof = getProfissional(consulta.profissionalId);
  const cons = getConsultorio(consulta.consultorioId);
  const total = consulta.valorConsulta;

  function cancelar() {
    if (!motivo.trim()) {
      toast.warning("Informe o motivo do cancelamento (AG06)");
      return;
    }
    setConsulta((c) => ({
      ...c,
      status: "cancelado",
      motivoCancelamento: motivo.trim(),
    }));
    setShowCancelar(false);
    toast.success("Consulta cancelada", {
      description: "Enviamos o cancelamento ao consultório. Sem cobrança de taxa.",
    });
    setTimeout(() => router.push("/p/consultas"), 800);
  }

  const podeCancelar = consulta.status === "agendado";
  const podeReagendar = consulta.status === "agendado";

  return (
    <>
      <Link
        href="/p/consultas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Minhas consultas
      </Link>

      <PageHeader
        title={`Consulta #${consulta.id}`}
        description={`${formatDateLong(consulta.data)} · ${consulta.hora}`}
        actions={
          !showCancelar && (podeCancelar || podeReagendar) ? (
            <div className="flex gap-2">
              {podeReagendar && (
                <Link
                  href={`/p/agendar?remarcacao=${consulta.id}`}
                  className={buttonVariants({ variant: "outline" })}
                >
                  <CalendarClock size={16} />
                  Reagendar
                </Link>
              )}
              {podeCancelar && (
                <Button
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowCancelar(true)}
                >
                  <X size={16} />
                  Cancelar consulta
                </Button>
              )}
            </div>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Informações da consulta</CardTitle>
                <div className="flex gap-2">
                  <AgendamentoStatusBadge status={consulta.status} />
                  <PaymentStatusBadge status={consulta.statusPagamento} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Calendar}
                label="Data"
                value={formatDateLong(consulta.data)}
              />
              <InfoRow icon={Clock} label="Horário" value={consulta.hora} />
              <InfoRow
                icon={Stethoscope}
                label="Profissional"
                value={`${prof?.nome} · ${prof?.especialidade}`}
              />
              <InfoRow
                icon={MapPin}
                label="Consultório"
                value={cons?.nome ?? "—"}
              />
            </CardContent>
          </Card>

          {showCancelar && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Cancelar consulta (AG06)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sem cobrança de taxa. O motivo abaixo é obrigatório e fica
                  registrado para o consultório.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="motivo">Motivo do cancelamento</Label>
                  <Textarea
                    id="motivo"
                    placeholder="Ex: tive um imprevisto e não posso comparecer"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    required
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCancelar(false)}
                  >
                    Voltar
                  </Button>
                  <Button
                    className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={cancelar}
                  >
                    Confirmar cancelamento
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {consulta.motivoCancelamento && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm">Motivo do cancelamento</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{consulta.motivoCancelamento}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm tabular-nums">
              <div className="flex justify-between text-base">
                <span className="font-semibold">Valor da consulta</span>
                <span className="font-bold">{formatBRL(total)}</span>
              </div>
              {consulta.statusPagamento === "pendente" && (
                <p className="mt-3 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                  Pagamento será feito no atendimento presencial (dinheiro, Pix
                  ou cartão).
                </p>
              )}
              {consulta.statusPagamento === "pago" && (
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-success/10 p-3 text-sm text-success">
                  <CheckCircle2 size={14} />
                  Pagamento confirmado
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Precisa de ajuda?</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href="/p/perfil"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full justify-start",
                })}
              >
                Atualizar meus dados
              </Link>
            </CardContent>
          </Card>
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
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
