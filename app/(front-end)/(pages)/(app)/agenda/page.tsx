"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Play,
  Plus,
  UserCheck,
  UserX,
  XCircle,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiCancelarAgendamento,
  apiListAgendamentos,
  apiMarcarChegada,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import { apiNaoCompareceu } from "@/lib/api/atendimentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate, formatDateLong } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";
import type { Role } from "@/lib/role";

interface DiaSemana {
  data: string;
  dia: string;
  num: string;
}

function buildDiasSemana(): DiaSemana[] {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dow = hoje.getDay();
  const start = new Date(hoje);
  // ajusta para segunda-feira da semana atual (skip FDS)
  if (dow === 0) start.setDate(hoje.getDate() + 1);
  else if (dow === 6) start.setDate(hoje.getDate() + 2);
  else start.setDate(hoje.getDate() - (dow - 1));

  return Array.from({ length: 5 }).map((_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const iso = `${yyyy}-${mm}-${dd}`;
    const abbr = formatDate(d, "EEE").replace(/\.$/, "");
    return {
      data: iso,
      dia: abbr.charAt(0).toUpperCase() + abbr.slice(1),
      num: String(d.getDate()).padStart(2, "0"),
    };
  });
}

export default function AgendaPage() {
  const { role, profissionalId } = useCurrentUser();
  const DIAS = useMemo(() => buildDiasSemana(), []);
  const hojeIso = useMemo(() => {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    const yyyy = h.getFullYear();
    const mm = String(h.getMonth() + 1).padStart(2, "0");
    const dd = String(h.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }, []);
  const [diaSelecionado, setDiaSelecionado] = useState(
    () => DIAS.find((d) => d.data === hojeIso)?.data ?? DIAS[0].data,
  );
  const [agendamentos, setAgendamentos] = useState<AgendamentoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { agendamentos } = await apiListAgendamentos({
        data: diaSelecionado,
      });
      setAgendamentos(
        agendamentos
          .filter((a) => a.status !== "cancelado")
          .sort((a, b) => a.hora.localeCompare(b.hora)),
      );
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [diaSelecionado]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleMarcarChegada(id: string) {
    try {
      await apiMarcarChegada(id);
      toast.success("Chegada registrada");
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleNaoCompareceu(id: string) {
    try {
      await apiNaoCompareceu(id);
      toast.success("Marcado como não compareceu");
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCancelar(id: string) {
    if (motivo.trim().length < 3) {
      toast.warning("Motivo é obrigatório (mínimo 3 caracteres)");
      return;
    }
    try {
      await apiCancelarAgendamento(id, motivo.trim());
      toast.success("Agendamento cancelado");
      setCancelandoId(null);
      setMotivo("");
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  return (
    <>
      <PageHeader
        title="Agenda"
        description={`${formatDateLong(diaSelecionado)} · visão do dia`}
        actions={
          (role === "admin" ||
            role === "auxiliar" ||
            role === "atendente") && (
            <Link href="/agenda/novo" className={buttonVariants()}>
              <Plus size={16} />
              Novo agendamento
            </Link>
          )
        }
      />

      <div className="mb-6 grid grid-cols-5 gap-2">
        {DIAS.map((d) => (
          <Button
            key={d.data}
            type="button"
            variant="ghost"
            onClick={() => setDiaSelecionado(d.data)}
            className={`h-auto flex-col gap-1 rounded-xl border p-3 ${
              d.data === diaSelecionado
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <span className="text-xs font-medium uppercase">{d.dia}</span>
            <span className="text-xl font-bold tabular-nums">{d.num}</span>
          </Button>
        ))}
      </div>

      {loading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Carregando…
        </p>
      ) : agendamentos.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum atendimento neste dia"
          description="Aproveite para revisar prontuários ou ajustar a agenda."
        />
      ) : (
        <div className="space-y-3">
          {agendamentos.map((a) => (
            <AgendamentoCard
              key={a.id}
              atendimento={a}
              role={role}
              profissionalId={profissionalId}
              cancelandoId={cancelandoId}
              motivo={motivo}
              onMotivoChange={setMotivo}
              onIniciarCancelar={() => {
                setCancelandoId(a.id);
                setMotivo("");
              }}
              onConfirmCancelar={() => handleCancelar(a.id)}
              onAbortCancelar={() => {
                setCancelandoId(null);
                setMotivo("");
              }}
              onMarcarChegada={() => handleMarcarChegada(a.id)}
              onNaoCompareceu={() => handleNaoCompareceu(a.id)}
            />
          ))}
        </div>
      )}
    </>
  );
}

interface CardProps {
  atendimento: AgendamentoListItem;
  role: Role;
  profissionalId: string | null;
  cancelandoId: string | null;
  motivo: string;
  onMotivoChange: (v: string) => void;
  onIniciarCancelar: () => void;
  onConfirmCancelar: () => void;
  onAbortCancelar: () => void;
  onMarcarChegada: () => void;
  onNaoCompareceu: () => void;
}

function AgendamentoCard({
  atendimento: a,
  role,
  profissionalId,
  cancelandoId,
  motivo,
  onMotivoChange,
  onIniciarCancelar,
  onConfirmCancelar,
  onAbortCancelar,
  onMarcarChegada,
  onNaoCompareceu,
}: CardProps) {
  const isStaff =
    role === "admin" || role === "auxiliar" || role === "atendente";
  const isProfissionalDono =
    role === "profissional" && profissionalId === a.profissionalId;
  const podeAtuar =
    role === "admin" || role === "auxiliar" || isProfissionalDono;
  const cancelando = cancelandoId === a.id;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-14 flex-col items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock size={14} />
            <span className="mt-0.5 text-sm font-bold tabular-nums">
              {a.hora}
            </span>
          </div>
          <div className="min-w-0">
            <CardTitle className="truncate text-base">
              {a.paciente.nome}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {a.profissional.nome} · {a.profissional.especialidade}
            </p>
            <p className="text-xs text-muted-foreground">
              {a.consultorio.nome}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <AgendamentoStatusBadge status={a.status} />
          <PaymentStatusBadge status={a.statusPagamento} />
          <p className="text-sm font-semibold tabular-nums">
            {formatBRL(Number(a.valorConsulta))}
          </p>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <Link
          href={`/atendimentos/${a.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          Ver detalhes
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {a.status === "agendado" && isStaff && (
            <Button size="sm" variant="outline" onClick={onMarcarChegada}>
              <UserCheck size={14} />
              Chegou
            </Button>
          )}
          {a.status === "agendado" && podeAtuar && (
            <Link
              href={`/atendimentos/${a.id}`}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <Play size={14} />
              Iniciar
            </Link>
          )}
          {a.status === "em_atendimento" && podeAtuar && (
            <Link
              href={`/atendimentos/${a.id}`}
              className={buttonVariants({ size: "sm" })}
            >
              <CheckCircle2 size={14} />
              Finalizar
            </Link>
          )}
          {a.status === "agendado" && isStaff && (
            <Button
              size="sm"
              variant="outline"
              onClick={onNaoCompareceu}
              className="text-warning hover:text-warning"
            >
              <UserX size={14} />
              Não compareceu
            </Button>
          )}
          {(a.status === "agendado" || a.status === "em_atendimento") &&
            isStaff && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onIniciarCancelar}
                className="text-destructive hover:text-destructive"
              >
                <XCircle size={14} />
                Cancelar
              </Button>
            )}
        </div>

        {cancelando && (
          <div className="basis-full border-t border-border pt-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor={`motivo-${a.id}`}>
                  Motivo do cancelamento
                </Label>
                <Input
                  id={`motivo-${a.id}`}
                  value={motivo}
                  onChange={(e) => onMotivoChange(e.target.value)}
                  placeholder="Ex: Paciente solicitou remarcação"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onAbortCancelar}
                >
                  Voltar
                </Button>
                <Button
                  size="sm"
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onConfirmCancelar}
                >
                  Confirmar cancelamento
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
