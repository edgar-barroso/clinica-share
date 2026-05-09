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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
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

type ConfirmAction =
  | { kind: "chegada"; id: string; nome: string; hora: string }
  | { kind: "naoCompareceu"; id: string; nome: string; hora: string }
  | { kind: "cancelar"; id: string; nome: string; hora: string };

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
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

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
      setConfirmAction(null);
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleNaoCompareceu(id: string) {
    try {
      await apiNaoCompareceu(id);
      toast.success("Marcado como não compareceu");
      setConfirmAction(null);
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function handleCancelar(id: string, motivo: string) {
    try {
      await apiCancelarAgendamento(id, motivo);
      toast.success("Agendamento cancelado");
      setConfirmAction(null);
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} aria-hidden="true">
              <CardHeader className="flex flex-row items-start justify-between gap-3 p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-14 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-44" />
                    <Skeleton className="h-3 w-56" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <Skeleton className="h-8 w-24" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
              onMarcarChegada={() =>
                setConfirmAction({
                  kind: "chegada",
                  id: a.id,
                  nome: a.paciente.nome,
                  hora: a.hora,
                })
              }
              onNaoCompareceu={() =>
                setConfirmAction({
                  kind: "naoCompareceu",
                  id: a.id,
                  nome: a.paciente.nome,
                  hora: a.hora,
                })
              }
              onCancelar={() =>
                setConfirmAction({
                  kind: "cancelar",
                  id: a.id,
                  nome: a.paciente.nome,
                  hora: a.hora,
                })
              }
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmAction?.kind === "chegada"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Confirmar chegada do paciente"
        description={
          confirmAction?.kind === "chegada" ? (
            <>
              Registrar que <strong>{confirmAction.nome}</strong> chegou para a
              consulta das <strong>{confirmAction.hora}</strong>? O profissional
              será notificado para iniciar o atendimento.
            </>
          ) : null
        }
        confirmLabel="Sim, registrar chegada"
        cancelLabel="Voltar"
        onConfirm={() => {
          if (confirmAction?.kind === "chegada") {
            void handleMarcarChegada(confirmAction.id);
          }
        }}
      />

      <ConfirmDialog
        open={confirmAction?.kind === "naoCompareceu"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Marcar como não compareceu?"
        variant="warning"
        description={
          confirmAction?.kind === "naoCompareceu" ? (
            <>
              <strong>{confirmAction.nome}</strong> ({confirmAction.hora}) será
              registrado como falta. Esta ação fica registrada no histórico e
              não pode ser desfeita.
            </>
          ) : null
        }
        confirmLabel="Sim, marcar falta"
        cancelLabel="Voltar"
        onConfirm={() => {
          if (confirmAction?.kind === "naoCompareceu") {
            void handleNaoCompareceu(confirmAction.id);
          }
        }}
      />

      <ConfirmDialog
        open={confirmAction?.kind === "cancelar"}
        onOpenChange={(o) => !o && setConfirmAction(null)}
        title="Cancelar agendamento?"
        variant="destructive"
        description={
          confirmAction?.kind === "cancelar" ? (
            <>
              Cancelando consulta de <strong>{confirmAction.nome}</strong> às{" "}
              <strong>{confirmAction.hora}</strong>. O motivo abaixo é
              registrado no audit log e o paciente é notificado.
            </>
          ) : null
        }
        confirmLabel="Confirmar cancelamento"
        cancelLabel="Voltar"
        prompt={{
          label: "Motivo do cancelamento",
          placeholder: "Ex: Paciente solicitou remarcação",
          required: true,
          minLength: 3,
          helper: "Mínimo 3 caracteres. Visível em relatórios e auditoria.",
        }}
        onConfirm={() => {}}
        onConfirmWithValue={(motivo) => {
          if (confirmAction?.kind === "cancelar") {
            void handleCancelar(confirmAction.id, motivo);
          }
        }}
      />
    </>
  );
}

interface CardProps {
  atendimento: AgendamentoListItem;
  role: Role;
  profissionalId: string | null;
  onMarcarChegada: () => void;
  onNaoCompareceu: () => void;
  onCancelar: () => void;
}

function AgendamentoCard({
  atendimento: a,
  role,
  profissionalId,
  onMarcarChegada,
  onNaoCompareceu,
  onCancelar,
}: CardProps) {
  const isStaff =
    role === "admin" || role === "auxiliar" || role === "atendente";
  const isProfissionalDono =
    role === "profissional" && profissionalId === a.profissionalId;
  const podeAtuar =
    role === "admin" || role === "auxiliar" || isProfissionalDono;

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
                onClick={onCancelar}
                className="text-destructive hover:text-destructive"
              >
                <XCircle size={14} />
                Cancelar
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
