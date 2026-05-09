"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CalendarClock, Check, MapPin, Stethoscope } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiCancelarAgendamento,
  apiCreateAgendamento,
  apiGetAgendamento,
  apiListAgendamentos,
  type AgendamentoListItem,
} from "@/lib/api/agendamentos";
import {
  apiListProfissionais,
  type Profissional,
} from "@/lib/api/profissionais";
import {
  apiListConsultorios,
  type Consultorio,
} from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDateLong, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/current-user";

const STEPS = [
  { key: "especialidade", label: "Especialidade" },
  { key: "profissional", label: "Profissional" },
  { key: "data", label: "Data" },
  { key: "horario", label: "Horário" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const HORARIOS = [
  { periodo: "Manhã", slots: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00"] },
  { periodo: "Tarde", slots: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"] },
];

const VALOR_POR_ESPECIALIDADE: Record<string, number> = {
  Cardiologia: 350,
  Oftalmologia: 280,
  Ginecologia: 300,
  Psicologia: 260,
  Fisioterapia: 180,
};
const VALOR_DEFAULT = 220;

function initials(name: string) {
  const parts = name.split(" ").filter((x) => !["Dr.", "Dra."].includes(x));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AgendarPage() {
  return (
    <Suspense fallback={null}>
      <AgendarPageInner />
    </Suspense>
  );
}

function AgendarPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pacienteId, loading: userLoading } = useCurrentUser();
  const remarcacaoId = searchParams.get("remarcacao");

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [consultaOriginal, setConsultaOriginal] =
    useState<AgendamentoListItem | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  const [step, setStep] = useState<StepKey>("especialidade");
  const [especialidade, setEspecialidade] = useState<string | null>(null);
  const [profId, setProfId] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  // Carrega catálogos + (opcional) consulta para remarcação
  useEffect(() => {
    if (userLoading) return;
    if (!pacienteId) {
      router.replace("/login");
      return;
    }
    Promise.all([
      apiListProfissionais({ ativo: true }),
      apiListConsultorios({ ativo: true }),
      remarcacaoId
        ? apiGetAgendamento(remarcacaoId).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([profsRes, consRes, originalRes]) => {
        setProfissionais(profsRes.profissionais);
        setConsultorios(consRes.consultorios);
        if (remarcacaoId) {
          const original = originalRes?.agendamento ?? null;
          if (!original) {
            toast.error("Consulta não encontrada", {
              description: "Você só pode reagendar consultas da sua agenda.",
            });
            router.replace("/p/consultas");
            return;
          }
          setConsultaOriginal(original);
          // Pré-seleciona profissional + especialidade do original
          setProfId(original.profissionalId);
          setEspecialidade(original.profissional.especialidade);
          setStep("data");
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setBootstrapping(false));
  }, [pacienteId, userLoading, remarcacaoId, router]);

  const especialidades = useMemo(
    () => Array.from(new Set(profissionais.map((p) => p.especialidade))).sort(),
    [profissionais],
  );

  const profissionaisFiltrados = useMemo(
    () =>
      profissionais.filter(
        (p) => !especialidade || p.especialidade === especialidade,
      ),
    [profissionais, especialidade],
  );

  const profSelecionado = profId
    ? profissionais.find((p) => p.id === profId) ?? null
    : null;

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const isUltimoStep = step === "horario";

  // Próximos 14 dias úteis (skip FDS)
  const datasDisponiveis = useMemo(() => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const out: Date[] = [];
    let d = new Date(hoje);
    while (out.length < 14) {
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) out.push(new Date(d));
      d = new Date(d);
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, []);

  // Carrega ocupados quando (data, profId) mudam
  useEffect(() => {
    if (!data || !profId) {
      setOcupados(new Set());
      return;
    }
    apiListAgendamentos({ data, profissionalId: profId })
      .then((res) => {
        const set = new Set<string>();
        for (const a of res.agendamentos) {
          if (a.status !== "cancelado") set.add(a.hora);
        }
        setOcupados(set);
      })
      .catch((err) => toast.error(apiErrorMessage(err)));
  }, [data, profId]);

  const valorBase = profSelecionado
    ? VALOR_POR_ESPECIALIDADE[profSelecionado.especialidade] ?? VALOR_DEFAULT
    : 0;

  function canAdvance() {
    switch (step) {
      case "especialidade":
        return !!especialidade;
      case "profissional":
        return !!profId;
      case "data":
        return !!data;
      case "horario":
        return !!horario;
    }
  }

  function next() {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  }
  function prev() {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  }

  async function finalizar() {
    if (!pacienteId || !profId || !data || !horario) return;
    // Escolhe consultório compatível com a especialidade, ou primeiro ativo
    const consPreferido =
      consultorios.find((c) =>
        c.especialidadesCompativeis.includes(
          profSelecionado?.especialidade ?? "",
        ),
      ) ?? consultorios[0];
    if (!consPreferido) {
      toast.error("Nenhum consultório disponível");
      return;
    }
    setSubmitting(true);
    try {
      // Se for remarcação, cancela a original primeiro
      if (consultaOriginal) {
        await apiCancelarAgendamento(
          consultaOriginal.id,
          "Remarcado pelo paciente via portal",
        );
      }
      await apiCreateAgendamento({
        pacienteId,
        profissionalId: profId,
        consultorioId: consPreferido.id,
        data,
        hora: horario,
      });
      toast.success(
        consultaOriginal ? "Consulta reagendada" : "Consulta agendada",
        {
          description: consultaOriginal
            ? "A consulta original foi cancelada com motivo \"Remarcado\"."
            : "Pagamento presencial no atendimento. Você receberá lembretes (AG07).",
        },
      );
      router.push("/p/consultas");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (userLoading || bootstrapping) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando…
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title={consultaOriginal ? "Reagendar consulta" : "Agendar consulta"}
        description={
          consultaOriginal
            ? `Remarcando a consulta de ${formatDateLong(consultaOriginal.data)} às ${consultaOriginal.hora}`
            : "Escolha a especialidade, o profissional e o horário (AG01). O pagamento é feito presencialmente no atendimento (FI10)."
        }
        actions={
          <Link
            href={
              consultaOriginal
                ? `/p/consultas/${consultaOriginal.id}`
                : "/p"
            }
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        }
      />

      {consultaOriginal && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
          <CalendarClock size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">
              Reagendamento em andamento
            </p>
            <p className="mt-1 text-muted-foreground">
              Escolha uma nova data e horário. A consulta original (#
              {consultaOriginal.id.slice(0, 8)}) será cancelada
              automaticamente com motivo &quot;Remarcado&quot; e auditada.
            </p>
          </div>
        </div>
      )}

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between text-sm">
          <p className="font-medium text-primary">
            Etapa {stepIndex + 1} de {STEPS.length}
          </p>
          <p className="text-muted-foreground">{STEPS[stepIndex].label}</p>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= stepIndex ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isUltimoStep && canAdvance()) void finalizar();
          else if (canAdvance()) next();
        }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {step === "especialidade" && "Qual especialidade você precisa?"}
                {step === "profissional" && "Escolha o profissional"}
                {step === "data" && "Qual data prefere?"}
                {step === "horario" && "Escolha o horário"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === "especialidade" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {especialidades.length === 0 && (
                    <p className="col-span-full text-sm text-muted-foreground">
                      Nenhuma especialidade disponível.
                    </p>
                  )}
                  {especialidades.map((esp) => {
                    const active = especialidade === esp;
                    return (
                      <button
                        key={esp}
                        type="button"
                        onClick={() => {
                          setEspecialidade(esp);
                          setProfId(null);
                        }}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-9 items-center justify-center rounded-xl",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary",
                          )}
                        >
                          <Stethoscope size={16} />
                        </div>
                        <span className="text-sm font-medium">{esp}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === "profissional" && (
                <div className="space-y-3">
                  {profissionaisFiltrados.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhum profissional disponível para essa especialidade.
                    </p>
                  )}
                  {profissionaisFiltrados.map((p) => {
                    const active = profId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setProfId(p.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          {initials(p.nome)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.especialidade} · {p.conselho}
                          </p>
                        </div>
                        {active && (
                          <Check size={18} className="text-primary" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {step === "data" && (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {datasDisponiveis.map((d) => {
                    const iso = isoDate(d);
                    const active = data === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => {
                          setData(iso);
                          setHorario(null);
                        }}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <p className="text-xs font-medium capitalize text-muted-foreground">
                          {formatWeekday(d)}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDateLong(d)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}

              {step === "horario" && (
                <div className="space-y-5">
                  {HORARIOS.map((bloco) => (
                    <div key={bloco.periodo}>
                      <p className="mb-2 text-sm font-medium">
                        {bloco.periodo}
                      </p>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        {bloco.slots.map((h) => {
                          const ocupado = ocupados.has(h);
                          const active = horario === h;
                          return (
                            <button
                              key={h}
                              type="button"
                              disabled={ocupado}
                              onClick={() => setHorario(h)}
                              className={cn(
                                "rounded-xl border px-3 py-3 text-sm font-medium tabular-nums transition-colors",
                                ocupado
                                  ? "cursor-not-allowed border-border bg-muted/60 text-muted-foreground line-through"
                                  : active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-card hover:bg-muted",
                              )}
                            >
                              {h}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <dl className="space-y-2 rounded-xl bg-muted/50 p-3 text-xs">
                <DefItem label="Especialidade" value={especialidade} />
                <DefItem
                  label="Profissional"
                  value={profSelecionado?.nome ?? null}
                />
                <DefItem
                  label="Data"
                  value={data ? formatDateLong(data) : null}
                />
                <DefItem label="Horário" value={horario} mono />
              </dl>
              {valorBase > 0 && (
                <div className="space-y-1 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Valor estimado</span>
                    <span className="tabular-nums">
                      {formatBRL(valorBase)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pode variar conforme o atendimento.
                  </p>
                </div>
              )}
              <div className="flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                <MapPin size={14} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="font-medium text-foreground">
                    Pagamento presencial
                  </p>
                  <p className="mt-0.5">
                    O pagamento é feito diretamente com o profissional no
                    consultório (dinheiro, Pix ou cartão na maquininha). Sem
                    cobrança antecipada.
                  </p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {stepIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prev}
                    className="flex-1"
                    disabled={submitting}
                  >
                    Voltar
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={!canAdvance() || submitting}
                  className="flex-1"
                >
                  {submitting
                    ? "Salvando..."
                    : isUltimoStep
                      ? "Confirmar agendamento"
                      : "Continuar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}

function DefItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right font-medium",
          mono && "tabular-nums",
          !value && "italic text-muted-foreground",
        )}
      >
        {value ?? "— selecione —"}
      </dd>
    </div>
  );
}
