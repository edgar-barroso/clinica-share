"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, DoorOpen, ShieldAlert } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  apiCreateWalkIn,
  apiListAtendimentos,
  type FinalizarAtendimentoInput,
} from "@/lib/api/atendimentos";
import { apiGetTurnos } from "@/lib/api/configuracoes";
import { apiErrorMessage } from "@/lib/api-client";
import {
  BLOCOS_PADRAO,
  gerarSlots,
  slotConflita,
  turnosConfigParaBlocos,
  type Bloco,
} from "@/lib/horarios";

function hojeISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
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

const NOME_DOW = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

export default function NovoAtendimentoPage() {
  const router = useRouter();

  const [pacienteId, setPacienteId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState(hojeISO);
  const [horario, setHorario] = useState<string | null>(null);
  const [valorConsulta, setValorConsulta] = useState("250");
  const [statusPagamento, setStatusPagamento] =
    useState<FinalizarAtendimentoInput["statusPagamento"]>("pago");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [tipoProntuario, setTipoProntuario] = useState<"interno" | "externo">(
    "interno",
  );
  const [prontuario, setProntuario] = useState({
    anamnese: "",
    evolucao: "",
    conduta: "",
    retorno: "",
  });
  // Onde o prontuário é mantido quando 'externo' (ex: sistema próprio
  // do profissional, papel arquivado na sala). Texto livre, opcional.
  const [prontuarioExternoRef, setProntuarioExternoRef] = useState("");

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [blocos, setBlocos] = useState<Bloco[]>(BLOCOS_PADRAO);

  useEffect(() => {
    apiListProfissionais({ ativo: true })
      .then((res) => {
        setProfissionais(res.profissionais);
        if (res.profissionais.length > 0) {
          const primeiro = res.profissionais[0];
          setProfissionalId(primeiro.id);
          setValorConsulta(String(Number(primeiro.valorConsultaBase)));
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err)));

    apiGetTurnos()
      .then((res) => setBlocos(turnosConfigParaBlocos(res.turnos)))
      .catch(() => {
        // mantém BLOCOS_PADRAO
      });
  }, []);

  // Carrega ocupados quando (profissional, data) mudam — evita registrar
  // dois atendimentos na mesma (data, hora, sala).
  useEffect(() => {
    if (!profissionalId || !data) {
      setOcupados(new Set());
      return;
    }
    apiListAtendimentos({ data, profissionalId })
      .then((res) => {
        const set = new Set<string>();
        for (const a of res.atendimentos) {
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

  // Reseta horário quando lista de slots muda (prof ou data novo).
  useEffect(() => {
    setHorario((cur) => {
      if (!cur) return cur;
      const valid = horariosBlocos.some((b) => b.slots.includes(cur));
      return valid ? cur : null;
    });
  }, [horariosBlocos]);

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
    if (statusPagamento === "gratuito" && motivo.trim().length < 3) {
      toast.warning("Motivo é obrigatório para atendimento gratuito");
      return;
    }

    setSubmitting(true);
    try {
      // Monta o payload do prontuário conforme o tipo escolhido.
      let prontuarioPayload: Record<string, unknown> | undefined;
      if (tipoProntuario === "externo") {
        prontuarioPayload = {
          tipo: "externo",
          referencia: prontuarioExternoRef.trim() || undefined,
        };
      } else {
        const algum = Object.values(prontuario).some(
          (v) => v.trim().length > 0,
        );
        if (algum) {
          prontuarioPayload = {
            tipo: "interno",
            anamnese: prontuario.anamnese.trim(),
            evolucao: prontuario.evolucao.trim(),
            conduta: prontuario.conduta.trim(),
            retorno: prontuario.retorno.trim(),
          };
        }
      }

      await apiCreateWalkIn({
        pacienteId,
        profissionalId,
        consultorioId: turnoFixoDoSlot.consultorioId,
        data,
        hora: horario,
        valorConsulta: Number(valorConsulta) || 0,
        statusPagamento,
        motivoDescontoOuGratuidade:
          statusPagamento === "gratuito" ? motivo.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
        prontuarioInterno: prontuarioPayload,
      });
      toast.success("Atendimento registrado");
      router.push("/atendimentos");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Registrar atendimento avulso"
        description="Use este fluxo apenas para walk-in (sem agendamento prévio) ou ajuste retroativo."
        actions={
          <Link
            href="/atendimentos"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        }
      />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-3 text-xs text-warning">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        <span>
          O caminho padrão é finalizar pela agenda do dia (após chegada e
          atendimento). Use este formulário só quando o paciente não passou
          pelo fluxo de agendamento.
        </span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
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
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profissional">Profissional</Label>
                {profissionais.length === 0 ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Select
                    id="profissional"
                    value={profissionalId}
                    onChange={(e) => {
                      const novoId = e.target.value;
                      setProfissionalId(novoId);
                      setHorario(null);
                      const prof = profissionais.find((p) => p.id === novoId);
                      if (prof) {
                        setValorConsulta(String(Number(prof.valorConsultaBase)));
                      }
                    }}
                    required
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
                      Cadastre antes de registrar atendimento.
                    </p>
                  )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data">Data do atendimento</Label>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Horário</CardTitle>
              <CardDescription>
                Sala vem do turno fixo do profissional — sem seleção manual.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profAtendeNaData && (
                <p className="text-xs text-muted-foreground">
                  Slots de {duracaoMin} min nos turnos fixos de{" "}
                  <span className="font-medium text-foreground">
                    {profSelecionado?.nome}
                  </span>
                  .
                </p>
              )}

              {horariosBlocos.length === 0 && profAtendeNaData && (
                <p className="text-sm text-muted-foreground">
                  Nenhum slot disponível nesta combinação.
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

              {turnoFixoDoSlot && (
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">
                  <DoorOpen size={14} className="shrink-0 text-primary" />
                  <span>
                    Sala atribuída:{" "}
                    <strong>{turnoFixoDoSlot.consultorio.nome}</strong>{" "}
                    <span className="text-muted-foreground">
                      ·{" "}
                      {dowDaData !== null && NOME_DOW[dowDaData]}
                      {turnoDoHorario && ` (${TURNO_LABEL[turnoDoHorario]})`}
                    </span>
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor da consulta (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorConsulta}
                  onChange={(e) => setValorConsulta(e.target.value)}
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                {(["pago", "pendente", "gratuito"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusPagamento(s)}
                    className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                      statusPagamento === s
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground hover:bg-muted"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {statusPagamento === "gratuito" && (
                <div className="space-y-1.5">
                  <Label htmlFor="motivo">Justificativa da gratuidade</Label>
                  <Input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ex: Cortesia para filho de funcionário"
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Prontuário</CardTitle>
              <CardDescription>
                Registro clínico do atendimento. Visível apenas para o
                profissional dono e admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoProntuario("interno")}
                  aria-pressed={tipoProntuario === "interno"}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    tipoProntuario === "interno"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">Prontuário interno</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Anamnese, evolução, conduta e retorno gravados aqui.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoProntuario("externo")}
                  aria-pressed={tipoProntuario === "externo"}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    tipoProntuario === "externo"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">Prontuário externo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mantido fora do sistema (papel ou outro software).
                  </p>
                </button>
              </div>

              {tipoProntuario === "interno" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <ProntuarioField
                    id="anamnese"
                    label="Anamnese"
                    placeholder="Queixa principal, histórico, sintomas relatados…"
                    value={prontuario.anamnese}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, anamnese: v }))
                    }
                  />
                  <ProntuarioField
                    id="evolucao"
                    label="Evolução"
                    placeholder="O que foi observado e a evolução do quadro."
                    value={prontuario.evolucao}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, evolucao: v }))
                    }
                  />
                  <ProntuarioField
                    id="conduta"
                    label="Conduta"
                    placeholder="Diagnóstico, prescrições, exames solicitados, orientações."
                    value={prontuario.conduta}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, conduta: v }))
                    }
                  />
                  <ProntuarioField
                    id="retorno"
                    label="Retorno"
                    placeholder="Necessidade e prazo do retorno (ex: 30 dias)."
                    value={prontuario.retorno}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, retorno: v }))
                    }
                  />
                </div>
              ) : (
                <div className="space-y-1.5 border-t border-border pt-4">
                  <Label htmlFor="prontuarioRef">
                    Referência do prontuário externo (opcional)
                  </Label>
                  <Input
                    id="prontuarioRef"
                    value={prontuarioExternoRef}
                    onChange={(e) => setProntuarioExternoRef(e.target.value)}
                    placeholder="Ex: Pasta nº 42 · Doctoralia · sistema próprio"
                  />
                  <p className="text-xs text-muted-foreground">
                    Apenas para localização. O conteúdo clínico não é gravado
                    no ClinicaShare.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações (opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Informações adicionais sobre o atendimento."
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={
              submitting || !pacienteId || !horario || !turnoFixoDoSlot
            }
          >
            <CheckCircle2 size={16} />
            {submitting ? "Salvando..." : "Registrar atendimento"}
          </Button>
        </aside>
      </form>
    </>
  );
}

function ProntuarioField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
