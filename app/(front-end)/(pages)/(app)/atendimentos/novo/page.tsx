"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  AlertCircle,
  CheckCircle2,
  DoorOpen,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
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
import { MonthlyCalendar } from "@/components/agenda/monthly-calendar";
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
  type ProcedimentoInput,
} from "@/lib/api/atendimentos";
import { apiGetTurnos } from "@/lib/api/configuracoes";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";
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

/** AT02 — mesmo teto do `procedimentosSchema` no back-end. */
const MAX_PROCEDIMENTOS = 20;

/**
 * AT02 — linha do editor de procedimentos extras. `valor` fica como string
 * porque é o que o `<input type="number">` entrega; a conversão só acontece
 * no submit. `key` é local (React), nunca vai para o payload.
 */
interface ProcedimentoLinha {
  key: string;
  descricao: string;
  valor: string;
}

/** Número do input → `null` quando vazio ou inválido (não vira 0 silencioso). */
function parseValor(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Evita ruído de ponto flutuante ao somar centavos (0.1 + 0.2). */
function arredonda2(n: number): number {
  return Math.round(n * 100) / 100;
}

export default function NovoAtendimentoPage() {
  const router = useRouter();

  const [pacienteId, setPacienteId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [data, setData] = useState(hojeISO);
  const [horario, setHorario] = useState<string | null>(null);
  const [valorConsulta, setValorConsulta] = useState("250");
  // FI06 — preço de tabela do profissional. Cobrar abaixo dele é desconto
  // e passa a exigir justificativa, igual à gratuidade.
  const [valorTabela, setValorTabela] = useState("250");
  const [statusPagamento, setStatusPagamento] =
    useState<FinalizarAtendimentoInput["statusPagamento"]>("pago");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");
  // AT02 — procedimentos extras cobrados junto da consulta (ex: endoscopia).
  const [procedimentos, setProcedimentos] = useState<ProcedimentoLinha[]>([]);
  const proximaKey = useRef(0);
  const [tipoProntuario, setTipoProntuario] = useState<"interno" | "externo">(
    "interno",
  );
  const [prontuario, setProntuario] = useState({
    anamnese: "",
    evolucao: "",
    conduta: "",
    retorno: "",
  });
  // AT04 — onde o prontuário é mantido quando 'externo' (sistema próprio do
  // profissional, pasta arquivada na sala). Obrigatório nesse modo: vai para
  // a coluna `referenciaProntuarioExterno`, não mais escondido no Json.
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
          const base = String(Number(primeiro.valorConsultaBase));
          setValorConsulta(base);
          setValorTabela(base);
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

  // Para o calendário: conjunto de DOWs em que o prof atende.
  const dowsAtende = useMemo(
    () => new Set<number>(turnosPorDow.keys()),
    [turnosPorDow],
  );

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

  const valorCobradoNum = parseValor(valorConsulta);
  const valorTabelaNum = parseValor(valorTabela);

  // FI06 — desconto parcial: cobrado abaixo do preço de tabela.
  const desconto =
    valorTabelaNum !== null &&
    valorCobradoNum !== null &&
    valorCobradoNum < valorTabelaNum
      ? arredonda2(valorTabelaNum - valorCobradoNum)
      : 0;
  const houveDesconto = desconto > 0;
  const ehGratuito = statusPagamento === "gratuito";
  // Mesmo campo (`motivoDescontoOuGratuidade`) para as duas situações.
  const exigeMotivo = ehGratuito || houveDesconto;
  const motivoLabel = ehGratuito
    ? "Justificativa da gratuidade"
    : "Justificativa do desconto";

  // AT02/FI04 — total ao vivo; a soma entra na base do repasse.
  const totalProcedimentos = useMemo(
    () =>
      arredonda2(
        procedimentos.reduce((acc, p) => acc + (parseValor(p.valor) ?? 0), 0),
      ),
    [procedimentos],
  );
  const totalGeral = arredonda2((valorCobradoNum ?? 0) + totalProcedimentos);

  const ehExterno = tipoProntuario === "externo";

  function adicionarProcedimento() {
    setProcedimentos((atual) => {
      if (atual.length >= MAX_PROCEDIMENTOS) return atual;
      proximaKey.current += 1;
      return [
        ...atual,
        { key: `proc-${proximaKey.current}`, descricao: "", valor: "" },
      ];
    });
  }

  function atualizarProcedimento(
    key: string,
    campo: "descricao" | "valor",
    valor: string,
  ) {
    setProcedimentos((atual) =>
      atual.map((p) => (p.key === key ? { ...p, [campo]: valor } : p)),
    );
  }

  function removerProcedimento(key: string) {
    setProcedimentos((atual) => atual.filter((p) => p.key !== key));
  }

  /**
   * Espelha as regras do `procedimentoSchema` (2–120 chars, valor >= 0,
   * máx. 20) para o usuário ver o erro sem ir até o 422 do servidor.
   * Linhas totalmente em branco (clicou em "Adicionar" e desistiu) são
   * descartadas em silêncio.
   */
  function montarProcedimentos(): ProcedimentoInput[] | "invalido" {
    const saida: ProcedimentoInput[] = [];
    for (let i = 0; i < procedimentos.length; i++) {
      const linha = procedimentos[i];
      const descricao = linha.descricao.trim();
      const valorTexto = linha.valor.trim();
      if (descricao === "" && valorTexto === "") continue;

      const numero = i + 1;
      if (descricao.length < 2 || descricao.length > 120) {
        toast.error(
          `Procedimento ${numero}: descrição deve ter entre 2 e 120 caracteres`,
        );
        return "invalido";
      }
      const valor = parseValor(valorTexto);
      if (valor === null || valor < 0) {
        toast.error(`Procedimento ${numero}: informe um valor válido em R$`);
        return "invalido";
      }
      saida.push({ descricao, valor });
    }
    if (saida.length > MAX_PROCEDIMENTOS) {
      toast.error(
        `Máximo de ${MAX_PROCEDIMENTOS} procedimentos por atendimento`,
      );
      return "invalido";
    }
    return saida;
  }

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
    if (valorCobradoNum === null || valorCobradoNum < 0) {
      toast.error("Informe um valor cobrado válido");
      return;
    }
    // FI06 — tabela abaixo do cobrado seria desconto negativo (422 no servidor).
    if (valorTabelaNum !== null && valorTabelaNum < valorCobradoNum) {
      toast.error("Valor de tabela não pode ser menor que o valor cobrado");
      return;
    }
    if (ehGratuito && motivo.trim().length < 3) {
      toast.error("Motivo é obrigatório para atendimento gratuito");
      return;
    }
    if (houveDesconto && motivo.trim().length < 3) {
      toast.error(
        "Justificativa é obrigatória quando o valor cobrado é menor que o de tabela",
      );
      return;
    }
    // AT04 — marcar "externo" sem dizer onde deixaria a ocorrência sem rastro.
    if (ehExterno && prontuarioExternoRef.trim().length < 3) {
      toast.error(
        "Informe a referência do prontuário externo (mínimo 3 caracteres)",
      );
      return;
    }

    const procedimentosPayload = montarProcedimentos();
    if (procedimentosPayload === "invalido") return;

    setSubmitting(true);
    try {
      // Prontuário interno só existe no modo interno — no externo o registro
      // vai para os campos estruturados (`usaProntuarioExterno` +
      // `referenciaProntuarioExterno`), não para dentro do Json.
      let prontuarioPayload: Record<string, unknown> | undefined;
      if (!ehExterno) {
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
        valorConsulta: valorCobradoNum,
        // Só viaja quando de fato houve desconto — sem desconto o campo fica
        // null no banco ("cobrado cheio").
        valorOriginal: houveDesconto ? valorTabelaNum ?? undefined : undefined,
        statusPagamento,
        motivoDescontoOuGratuidade: exigeMotivo ? motivo.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
        prontuarioInterno: prontuarioPayload,
        procedimentos:
          procedimentosPayload.length > 0 ? procedimentosPayload : undefined,
        usaProntuarioExterno: ehExterno,
        referenciaProntuarioExterno: ehExterno
          ? prontuarioExternoRef.trim()
          : undefined,
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
                        const base = String(Number(prof.valorConsultaBase));
                        setValorConsulta(base);
                        setValorTabela(base);
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
                <Label>Data do atendimento</Label>
                {!profSelecionado ? (
                  <p className="text-xs text-muted-foreground">
                    Escolha um profissional para ver as datas disponíveis.
                  </p>
                ) : dowsAtende.size === 0 ? (
                  <p className="flex items-start gap-1.5 text-xs text-warning">
                    <AlertCircle size={12} className="mt-0.5 shrink-0" />
                    Profissional sem turnos fixos. Cadastre antes de
                    registrar.
                  </p>
                ) : (
                  <MonthlyCalendar
                    value={data}
                    onChange={(iso) => {
                      setData(iso);
                      setHorario(null);
                    }}
                    diasUteisAtende={dowsAtende}
                    allowPast
                  />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="valorTabela">Valor de tabela (R$)</Label>
                  <Input
                    id="valorTabela"
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorTabela}
                    onChange={(e) => setValorTabela(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Preço cheio do profissional. Deixe em branco se não houver
                    tabela.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="valor">Valor cobrado (R$)</Label>
                  <Input
                    id="valor"
                    type="number"
                    min="0"
                    step="0.01"
                    value={valorConsulta}
                    onChange={(e) => setValorConsulta(e.target.value)}
                    aria-required="true"
                  />
                  <p className="text-xs text-muted-foreground">
                    O que o paciente paga por esta consulta.
                  </p>
                </div>
              </div>

              {houveDesconto && (
                <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <span>
                    Desconto de{" "}
                    <strong
                      data-testid="desconto-concedido"
                      className="tabular-nums"
                    >
                      {formatBRL(desconto)}
                    </strong>{" "}
                    sobre o valor de tabela. Justificativa obrigatória.
                  </span>
                </div>
              )}

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
              {exigeMotivo && (
                <div className="space-y-1.5">
                  <Label htmlFor="motivo">{motivoLabel}</Label>
                  <Input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder={
                      ehGratuito
                        ? "Ex: Cortesia para filho de funcionário"
                        : "Ex: Paciente encaminhado por convênio parceiro"
                    }
                    aria-required="true"
                  />
                  <p className="text-xs text-muted-foreground">
                    Obrigatória (mínimo 3 caracteres) e registrada no histórico
                    financeiro.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Procedimentos extras</CardTitle>
              <CardDescription>
                Cobranças além da consulta (ex: endoscopia, cauterização). O
                total entra na base do repasse do profissional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {procedimentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum procedimento extra registrado.
                </p>
              ) : (
                <div className="space-y-3">
                  <div className="hidden gap-3 sm:grid sm:grid-cols-[1fr_9rem_2.5rem]">
                    <span className="text-xs font-medium text-muted-foreground">
                      Descrição
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      Valor (R$)
                    </span>
                    <span className="sr-only">Ações</span>
                  </div>
                  {procedimentos.map((p, i) => {
                    const numero = i + 1;
                    const descricaoLabel = `Descrição do procedimento ${numero}`;
                    const valorLabel = `Valor do procedimento ${numero}`;
                    return (
                      <div
                        key={p.key}
                        className="grid gap-3 sm:grid-cols-[1fr_9rem_2.5rem] sm:items-start"
                      >
                        <div className="space-y-1.5">
                          <Label
                            htmlFor={`procedimento-descricao-${numero}`}
                            className="sr-only"
                          >
                            {descricaoLabel}
                          </Label>
                          <Input
                            id={`procedimento-descricao-${numero}`}
                            aria-label={descricaoLabel}
                            value={p.descricao}
                            onChange={(e) =>
                              atualizarProcedimento(
                                p.key,
                                "descricao",
                                e.target.value,
                              )
                            }
                            maxLength={120}
                            placeholder="Ex: Endoscopia digestiva alta"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label
                            htmlFor={`procedimento-valor-${numero}`}
                            className="sr-only"
                          >
                            {valorLabel}
                          </Label>
                          <Input
                            id={`procedimento-valor-${numero}`}
                            aria-label={valorLabel}
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={p.valor}
                            onChange={(e) =>
                              atualizarProcedimento(
                                p.key,
                                "valor",
                                e.target.value,
                              )
                            }
                            placeholder="0,00"
                            className="tabular-nums"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remover procedimento ${numero}`}
                          onClick={() => removerProcedimento(p.key)}
                          className="justify-self-start text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={adicionarProcedimento}
                disabled={procedimentos.length >= MAX_PROCEDIMENTOS}
              >
                <Plus size={16} />
                Adicionar procedimento
              </Button>
              {procedimentos.length >= MAX_PROCEDIMENTOS && (
                <p className="text-xs text-warning">
                  Limite de {MAX_PROCEDIMENTOS} procedimentos por atendimento
                  atingido.
                </p>
              )}

              <div className="space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Total dos procedimentos
                  </span>
                  <span
                    data-testid="total-procedimentos"
                    className="font-medium tabular-nums"
                  >
                    {formatBRL(totalProcedimentos)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Total geral (consulta + procedimentos)
                  </span>
                  <span
                    data-testid="total-geral"
                    className="text-base font-semibold tabular-nums text-primary"
                  >
                    {formatBRL(totalGeral)}
                  </span>
                </div>
              </div>
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

              {!ehExterno ? (
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
                    Referência do prontuário externo
                  </Label>
                  <Input
                    id="prontuarioRef"
                    value={prontuarioExternoRef}
                    onChange={(e) => setProntuarioExternoRef(e.target.value)}
                    placeholder="Ex: Pasta nº 42 · Doctoralia · sistema próprio"
                    maxLength={200}
                    aria-required="true"
                  />
                  <p className="text-xs text-muted-foreground">
                    Obrigatória (mínimo 3 caracteres): diz onde encontrar o
                    registro. O conteúdo clínico não é gravado no ClinicaShare.
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
