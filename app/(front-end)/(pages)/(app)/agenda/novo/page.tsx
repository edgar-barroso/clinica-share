"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, Calendar, CheckCircle2, DoorOpen } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import { PacienteCombobox } from "@/components/paciente/paciente-combobox";
import {
  apiListProfissionais,
  type Profissional,
  type Turno,
  type TurnoFixo,
} from "@/lib/api/profissionais";
import {
  apiCreateAgendamento,
  apiListAgendamentos,
} from "@/lib/api/agendamentos";
import { apiGetTurnos } from "@/lib/api/configuracoes";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDateLong } from "@/lib/format";
import {
  BLOCOS_PADRAO,
  gerarSlots,
  slotConflita,
  turnosConfigParaBlocos,
  type Bloco,
} from "@/lib/horarios";

function amanhaISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const PERIODO_TO_TURNO: Record<string, Turno> = {
  Manhã: "manha",
  Tarde: "tarde",
  Noite: "noite",
};

const TURNO_LABEL: Record<Turno, string> = {
  manha: "manhã",
  tarde: "tarde",
  noite: "noite",
};

const NOME_DOW = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const [pacienteId, setPacienteId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState(amanhaISO);
  const [horario, setHorario] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  // Blocos da clínica vindos de /configuracoes/turnos.
  const [blocos, setBlocos] = useState<Bloco[]>(BLOCOS_PADRAO);

  useEffect(() => {
    apiListProfissionais({ ativo: true })
      .then((res) => {
        setProfissionais(res.profissionais);
        if (res.profissionais.length > 0 && !profissionalId) {
          setProfissionalId(res.profissionais[0].id);
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err)));

    apiGetTurnos()
      .then((res) => setBlocos(turnosConfigParaBlocos(res.turnos)))
      .catch(() => {
        // mantém BLOCOS_PADRAO se a API falhar
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Carrega ocupados quando (profissional, data) mudam
  useEffect(() => {
    if (!profissionalId || !data) {
      setOcupados(new Set());
      return;
    }
    apiListAgendamentos({ data, profissionalId })
      .then((res) => {
        const set = new Set<string>();
        for (const a of res.agendamentos) {
          if (a.status !== "cancelado") set.add(a.hora);
        }
        setOcupados(set);
      })
      .catch((err) => toast.error(apiErrorMessage(err)));
  }, [profissionalId, data]);

  const profSelecionado = useMemo(
    () => profissionais.find((p) => p.id === profissionalId) ?? null,
    [profissionais, profissionalId],
  );

  const duracaoMin = profSelecionado?.duracaoConsultaMinutos ?? 30;

  // Indexa turnos fixos por (DOW, turno) — fonte de verdade das salas
  // e horários disponíveis. Sem turnoFixo no slot escolhido, o backend
  // rejeita o agendamento, então a UI já filtra pra evitar erro.
  const turnosPorDow = useMemo(() => {
    const map = new Map<number, Map<Turno, TurnoFixo>>();
    if (!profSelecionado?.turnosFixos) return map;
    for (const tf of profSelecionado.turnosFixos) {
      if (!map.has(tf.diaSemana)) map.set(tf.diaSemana, new Map());
      map.get(tf.diaSemana)!.set(tf.turno, tf);
    }
    return map;
  }, [profSelecionado]);

  const dowDaData = useMemo(() => {
    if (!data) return null;
    return new Date(`${data}T12:00:00`).getDay();
  }, [data]);

  const profAtendeNaData = useMemo(() => {
    if (dowDaData === null) return false;
    return turnosPorDow.has(dowDaData);
  }, [dowDaData, turnosPorDow]);

  // Blocos restritos aos turnos fixos do prof no DOW da data
  const blocosPermitidos = useMemo(() => {
    if (dowDaData === null) return [];
    const turnos = turnosPorDow.get(dowDaData);
    if (!turnos || turnos.size === 0) return [];
    return blocos.filter((b) => {
      const t = PERIODO_TO_TURNO[b.periodo];
      return t !== undefined && turnos.has(t);
    });
  }, [blocos, dowDaData, turnosPorDow]);

  const horariosBlocos = useMemo(
    () => gerarSlots(blocosPermitidos, duracaoMin),
    [blocosPermitidos, duracaoMin],
  );

  // Reseta horário quando a lista de slots muda (novo prof ou nova data).
  useEffect(() => {
    setHorario((cur) => {
      if (!cur) return cur;
      const valid = horariosBlocos.some((b) => b.slots.includes(cur));
      return valid ? cur : null;
    });
  }, [horariosBlocos]);

  // Resolve o turnoFixo (e portanto o consultório) do horário selecionado.
  const turnoDoHorario: Turno | null = useMemo(() => {
    if (!horario) return null;
    const tarde = blocos.find((b) => b.periodo === "Tarde")?.inicio ?? "13:00";
    const noite = blocos.find((b) => b.periodo === "Noite")?.inicio ?? "18:00";
    if (horario < tarde) return "manha";
    if (horario < noite) return "tarde";
    return "noite";
  }, [horario, blocos]);

  const turnoFixoDoSlot = useMemo(() => {
    if (dowDaData === null || !turnoDoHorario) return null;
    return turnosPorDow.get(dowDaData)?.get(turnoDoHorario) ?? null;
  }, [dowDaData, turnoDoHorario, turnosPorDow]);

  const dataLabel = useMemo(() => {
    if (!data) return "—";
    return formatDateLong(data) || data;
  }, [data]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pacienteId) {
      toast.warning("Selecione um paciente");
      return;
    }
    if (!horario) {
      toast.warning("Escolha um horário disponível");
      return;
    }
    if (!turnoFixoDoSlot) {
      toast.error("Profissional não atende neste dia/horário");
      return;
    }
    setSubmitting(true);
    try {
      await apiCreateAgendamento({
        pacienteId,
        profissionalId,
        consultorioId: turnoFixoDoSlot.consultorioId,
        data,
        hora: horario,
        observacoes: observacoes.trim() || undefined,
      });
      toast.success("Agendamento criado");
      router.push("/agenda");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Novo agendamento"
        description="Atendente registra consulta em nome do paciente"
        actions={
          <Link href="/agenda" className={buttonVariants({ variant: "outline" })}>
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>1. Paciente e profissional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="paciente">Paciente</Label>
                <PacienteCombobox
                  id="paciente"
                  value={pacienteId}
                  onChange={setPacienteId}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Busque pelo nome, CPF, e-mail ou telefone. Se o paciente
                  ainda não estiver cadastrado, use{" "}
                  <span className="font-medium">
                    &quot;Cadastrar novo paciente&quot;
                  </span>
                  .
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profissional">Profissional</Label>
                {profissionais.length === 0 ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Select
                    id="profissional"
                    required
                    value={profissionalId}
                    onChange={(e) => {
                      setProfissionalId(e.target.value);
                      setHorario(null);
                    }}
                  >
                    {profissionais.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {p.especialidade}
                      </option>
                    ))}
                  </Select>
                )}
                {profSelecionado &&
                  (!profSelecionado.turnosFixos ||
                    profSelecionado.turnosFixos.length === 0) && (
                    <p className="flex items-start gap-1.5 text-xs text-warning">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      Este profissional não tem turnos fixos cadastrados.
                      Cadastre antes de agendar.
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Data e horário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => {
                    setData(e.target.value);
                    setHorario(null);
                  }}
                  required
                />
                {data && profSelecionado && !profAtendeNaData && (
                  <p className="flex items-start gap-1.5 text-xs text-warning">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    {profSelecionado.nome} não atende em{" "}
                    {dowDaData !== null ? NOME_DOW[dowDaData] : "—"}. Escolha
                    outro dia.
                  </p>
                )}
              </div>

              {profAtendeNaData && (
                <p className="text-xs text-muted-foreground">
                  Horários disponíveis nos turnos fixos de{" "}
                  <span className="font-medium text-foreground">
                    {profSelecionado?.nome}
                  </span>{" "}
                  · slots de {duracaoMin} min.
                </p>
              )}

              {horariosBlocos.length === 0 && profAtendeNaData && (
                <p className="text-sm text-muted-foreground">
                  Nenhum slot disponível para esta combinação.
                </p>
              )}

              {horariosBlocos.map((bloco) => (
                <div key={bloco.periodo}>
                  <p className="mb-2 text-sm font-medium">{bloco.periodo}</p>
                  <div className="grid grid-cols-4 gap-2">
                    {bloco.slots.map((h) => {
                      const ocupado = slotConflita(h, ocupados, duracaoMin);
                      const selecionado = horario === h;
                      return (
                        <button
                          key={h}
                          type="button"
                          disabled={ocupado}
                          onClick={() => setHorario(h)}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium tabular-nums transition-colors ${
                            ocupado
                              ? "border-border bg-muted/50 text-muted-foreground line-through cursor-not-allowed"
                              : selecionado
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-card hover:bg-muted"
                          }`}
                        >
                          {h}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Observações (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Ex: Paciente prefere ser atendido pela manhã."
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                Resumo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Confirme as informações antes de salvar.
              </p>
              <div className="space-y-2 rounded-xl bg-muted/50 p-3">
                <p>
                  <span className="text-muted-foreground">Data:</span>{" "}
                  <span className="font-medium">{dataLabel}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Horário:</span>{" "}
                  <span className="font-medium">
                    {horario ?? (
                      <span className="text-warning">— selecione —</span>
                    )}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Sala:</span>{" "}
                  {turnoFixoDoSlot ? (
                    <span className="inline-flex items-center gap-1 font-medium">
                      <DoorOpen size={12} />
                      {turnoFixoDoSlot.consultorio.nome}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      — definida pelo turno —
                    </span>
                  )}
                </p>
                {turnoFixoDoSlot && turnoDoHorario && (
                  <p className="text-xs text-muted-foreground">
                    Turno fixo do profissional: {NOME_DOW[turnoFixoDoSlot.diaSemana]}{" "}
                    · {TURNO_LABEL[turnoDoHorario]}
                  </p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                A sala é definida automaticamente pelo turno fixo do
                profissional cadastrado em{" "}
                <Link
                  href={
                    profSelecionado
                      ? `/profissionais/${profSelecionado.id}/editar`
                      : "/profissionais"
                  }
                  className="font-medium text-primary hover:underline"
                >
                  {profSelecionado ? "perfil do profissional" : "profissionais"}
                </Link>
                .
              </p>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!horario || !turnoFixoDoSlot || submitting}
          >
            <CheckCircle2 size={16} />
            {submitting ? "Salvando..." : "Confirmar agendamento"}
          </Button>
        </aside>
      </form>
    </>
  );
}
