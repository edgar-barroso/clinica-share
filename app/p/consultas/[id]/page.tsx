"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  MessageCircle,
  Stethoscope,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

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
  const total =
    consulta.valorConsulta +
    consulta.procedimentos.reduce((s, p) => s + p.valor, 0);

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

  const podeCancelar =
    consulta.status === "agendado" || consulta.status === "confirmado";

  return (
    <>
      <Link
        href="/p/consultas"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Minhas consultas
      </Link>

      <h1 className="mb-1 text-xl font-bold">Detalhes da consulta</h1>
      <p className="mb-5 text-sm text-muted-foreground">
        Consulta #{consulta.id}
      </p>

      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </p>
            <div className="flex gap-2">
              <AgendamentoStatusBadge status={consulta.status} />
              <PaymentStatusBadge status={consulta.statusPagamento} />
            </div>
          </div>

          <div className="mt-4 space-y-4">
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
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pagamento
          </p>
          <div className="mt-3 space-y-2 text-sm tabular-nums">
            <div className="flex justify-between">
              <span>Consulta</span>
              <span>{formatBRL(consulta.valorConsulta)}</span>
            </div>
            {consulta.procedimentos.length > 0 && (
              <>
                {consulta.procedimentos.map((p) => (
                  <div
                    key={p.nome}
                    className="flex justify-between text-muted-foreground"
                  >
                    <span>{p.nome}</span>
                    <span>{formatBRL(p.valor)}</span>
                  </div>
                ))}
              </>
            )}
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-semibold">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
          </div>
          {consulta.statusPagamento === "pendente" && (
            <Button className="mt-4 w-full">Pagar agora</Button>
          )}
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium transition-colors hover:bg-muted"
          aria-label="Conversar com o consultório"
        >
          <MessageCircle size={16} />
          Mensagens
        </button>
        <Link
          href={`/p/perfil`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          <User size={16} />
          Meus dados
        </Link>
      </div>

      {podeCancelar && !showCancelar && (
        <Button
          variant="outline"
          className="w-full text-destructive hover:text-destructive"
          onClick={() => setShowCancelar(true)}
        >
          <X size={16} />
          Cancelar consulta
        </Button>
      )}

      {showCancelar && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="space-y-3 p-5">
            <div>
              <p className="font-semibold">Cancelar consulta (AG06)</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Sem cobrança de taxa. O motivo abaixo é obrigatório e fica registrado
                para o consultório.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="motivo">Motivo</Label>
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
        <Card className="mt-4 border-destructive/40 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
              Motivo do cancelamento
            </p>
            <p className="mt-1 text-sm">{consulta.motivoCancelamento}</p>
          </CardContent>
        </Card>
      )}
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
