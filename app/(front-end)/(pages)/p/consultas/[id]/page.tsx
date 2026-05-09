"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  DoorOpen,
  FileText,
  User,
  XCircle,
} from "lucide-react";
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
  apiCancelarAgendamento,
  apiGetAgendamento,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDateLong } from "@/lib/format";

export default function MinhaConsultaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [a, setA] = useState<AgendamentoListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancel, setShowCancel] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { agendamento } = await apiGetAgendamento(id);
      setA(agendamento);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleCancelar() {
    if (motivo.trim().length < 3) {
      toast.warning("Informe um motivo (mínimo 3 caracteres)");
      return;
    }
    setSubmitting(true);
    try {
      await apiCancelarAgendamento(id, motivo.trim());
      toast.success("Consulta cancelada");
      setShowCancel(false);
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !a) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-56" />
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-36" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20 rounded-full" />
                    <Skeleton className="h-5 w-24 rounded-full" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
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
          </div>
          <aside className="space-y-4">
            <Skeleton className="h-32 rounded-2xl" />
          </aside>
        </div>
      </div>
    );
  }

  const podeCancelar = a.status === "agendado";

  return (
    <>
      <Link
        href="/p/consultas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para minhas consultas
      </Link>

      <PageHeader
        title="Detalhes da consulta"
        description={`${formatDateLong(a.data)} · ${a.hora}`}
        actions={
          podeCancelar && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => setShowCancel((s) => !s)}
            >
              <XCircle size={14} />
              Cancelar consulta
            </Button>
          )
        }
      />

      {showCancel && (
        <Card className="mb-6 border-destructive/40 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-sm">Confirmar cancelamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="motivo">Motivo</Label>
              <Input
                id="motivo"
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                placeholder="Ex: Conflito de horário no trabalho"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCancel(false)}
                disabled={submitting}
              >
                Voltar
              </Button>
              <Button
                onClick={handleCancelar}
                disabled={submitting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {submitting ? "Cancelando..." : "Confirmar cancelamento"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Informações</CardTitle>
                <div className="flex gap-2">
                  <AgendamentoStatusBadge status={a.status} />
                  <PaymentStatusBadge status={a.statusPagamento} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Info icon={Calendar} label="Data" value={formatDateLong(a.data)} />
              <Info icon={Clock} label="Horário" value={a.hora} />
              <Info
                icon={User}
                label="Profissional"
                value={`${a.profissional.nome} · ${a.profissional.especialidade}`}
              />
              <Info icon={DoorOpen} label="Consultório" value={a.consultorio.nome} />
              {a.observacoes && (
                <div className="sm:col-span-2">
                  <Info icon={FileText} label="Observações" value={a.observacoes} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Valor</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {formatBRL(Number(a.valorConsulta))}
              </p>
            </CardContent>
          </Card>

          {a.motivoCancelamento && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm">Motivo do cancelamento</CardTitle>
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

function Info({
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
