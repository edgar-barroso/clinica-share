"use client";

import Link from "next/link";
import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  DoorOpen,
  ExternalLink,
  FileText,
  Pencil,
  Play,
  Plus,
  Trash2,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
  apiFinalizarAtendimento,
  apiGetAtendimento,
  apiIniciarAtendimento,
  type AtendimentoDetail,
  type StatusPagamento,
} from "@/lib/api/atendimentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDateLong } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

interface ProntuarioForm {
  anamnese: string;
  evolucao: string;
  conduta: string;
  retorno: string;
}

/** AT02 — linha editável de procedimento extra (valor como string no input). */
interface ProcedimentoLinha {
  descricao: string;
  valor: string;
}

const PRONTUARIO_VAZIO: ProntuarioForm = {
  anamnese: "",
  evolucao: "",
  conduta: "",
  retorno: "",
};

const MAX_PROCEDIMENTOS = 20;

/** Aceita "350", "350.50" e "350,50" — o input number normaliza, o texto não. */
function paraNumero(valor: string): number {
  const n = Number(String(valor).trim().replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function somaProcedimentos(linhas: ProcedimentoLinha[]): number {
  return linhas.reduce((acc, l) => {
    const n = paraNumero(l.valor);
    return acc + (Number.isFinite(n) ? n : 0);
  }, 0);
}

export default function AtendimentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { role, profissionalId } = useCurrentUser();
  const [atendimento, setAtendimento] = useState<AtendimentoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFinalize, setShowFinalize] = useState(false);
  const [valor, setValor] = useState("");
  const [statusPag, setStatusPag] = useState<StatusPagamento>("pago");
  const [motivoJustificativa, setMotivoJustificativa] = useState("");
  const [procedimentos, setProcedimentos] = useState<ProcedimentoLinha[]>([]);
  const [usaProntuarioExterno, setUsaProntuarioExterno] = useState(false);
  const [referenciaExterna, setReferenciaExterna] = useState("");
  const [prontuario, setProntuario] = useState<ProntuarioForm>(PRONTUARIO_VAZIO);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { atendimento } = await apiGetAtendimento(id);
      setAtendimento(atendimento);
      setValor(String(atendimento.valorConsulta));
      // FI10: pagamento é presencial, no ato do atendimento — a esmagadora
      // maioria termina em `pago`. O `pendente` gravado no agendamento é só o
      // default do banco (ninguém escolheu ainda), então o formulário de
      // finalização já abre em "pago"; pendente e gratuito passam a ser
      // escolha explícita de quem registra. Atendimento já realizado mantém o
      // que ficou persistido — ali o valor foi decidido de fato.
      setStatusPag(
        atendimento.status !== "realizado" &&
          atendimento.statusPagamento === "pendente"
          ? "pago"
          : atendimento.statusPagamento,
      );
      setMotivoJustificativa(atendimento.motivoDescontoOuGratuidade ?? "");
      setProcedimentos(
        (atendimento.procedimentos ?? []).map((p) => ({
          descricao: p.descricao,
          valor: String(p.valor),
        })),
      );
      setUsaProntuarioExterno(atendimento.usaProntuarioExterno ?? false);
      setReferenciaExterna(atendimento.referenciaProntuarioExterno ?? "");
      const p = atendimento.prontuarioInterno as ProntuarioForm | null;
      if (p && typeof p === "object") {
        setProntuario({
          anamnese: p.anamnese ?? "",
          evolucao: p.evolucao ?? "",
          conduta: p.conduta ?? "",
          retorno: p.retorno ?? "",
        });
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading || !atendimento) {
    return <AtendimentoDetailSkeleton />;
  }

  const isProfissionalDono =
    role === "profissional" && profissionalId === atendimento.profissionalId;
  const podeIniciar =
    atendimento.status === "agendado" &&
    (role === "admin" || role === "auxiliar" || isProfissionalDono);
  const podeFinalizar =
    atendimento.status === "em_atendimento" &&
    (role === "admin" || role === "auxiliar" || isProfissionalDono);
  const podeEditar =
    atendimento.status === "realizado" &&
    (role === "admin" || role === "auxiliar");

  // --- FI04/FI06: totais ao vivo do formulário -----------------------------
  const valorCobradoNum = paraNumero(valor);
  const valorCobrado = Number.isFinite(valorCobradoNum) ? valorCobradoNum : 0;
  // FI06: o valor de tabela é o do cadastro do profissional (o servidor deriva
  // dele quando `valorOriginal` não vai no body). A tela só exibe — ninguém
  // digita o preço de novo.
  const valorTabelaTexto = atendimento.profissional.valorConsultaBase;
  const valorTabelaNum =
    valorTabelaTexto != null ? Number(valorTabelaTexto) : NaN;
  const temValorTabela = Number.isFinite(valorTabelaNum);
  const totalProcedimentos = somaProcedimentos(procedimentos);
  const totalGeral = valorCobrado + totalProcedimentos;
  const temDesconto = temValorTabela && valorCobrado < valorTabelaNum;
  const descontoConcedido = temDesconto ? valorTabelaNum - valorCobrado : 0;
  const ehGratuito = statusPag === "gratuito";
  const motivoObrigatorio = temDesconto || ehGratuito;

  // --- Valores já persistidos (card lateral) -------------------------------
  const procedimentosSalvos = atendimento.procedimentos ?? [];
  const valorProcedimentosSalvo = Number(
    atendimento.valorProcedimentos ?? somaProcedimentos([]),
  );
  const valorTotalSalvo = Number(
    atendimento.valorTotal ??
      Number(atendimento.valorConsulta) + valorProcedimentosSalvo,
  );
  const valorOriginalSalvo =
    atendimento.valorOriginal != null ? Number(atendimento.valorOriginal) : null;
  const descontoSalvo =
    valorOriginalSalvo != null &&
    valorOriginalSalvo > Number(atendimento.valorConsulta)
      ? valorOriginalSalvo - Number(atendimento.valorConsulta)
      : 0;

  function adicionarProcedimento() {
    setProcedimentos((atual) => {
      if (atual.length >= MAX_PROCEDIMENTOS) {
        toast.warning(
          `Máximo de ${MAX_PROCEDIMENTOS} procedimentos por atendimento`,
        );
        return atual;
      }
      return [...atual, { descricao: "", valor: "" }];
    });
  }

  /** Mesmas regras do servidor — evita a ida e volta e dá feedback imediato. */
  function validarFormulario(): string | null {
    if (!Number.isFinite(valorCobradoNum) || valorCobradoNum < 0) {
      return "Informe um valor cobrado válido";
    }
    if (motivoObrigatorio && motivoJustificativa.trim().length < 3) {
      return ehGratuito
        ? "Informe a justificativa da gratuidade (mínimo 3 caracteres)"
        : "Informe a justificativa do desconto (mínimo 3 caracteres)";
    }
    if (usaProntuarioExterno && referenciaExterna.trim().length < 3) {
      return "Informe onde o prontuário foi registrado (mínimo 3 caracteres)";
    }
    if (procedimentos.length > MAX_PROCEDIMENTOS) {
      return `Máximo de ${MAX_PROCEDIMENTOS} procedimentos por atendimento`;
    }
    for (let i = 0; i < procedimentos.length; i++) {
      const descricao = procedimentos[i].descricao.trim();
      if (descricao.length < 2 || descricao.length > 120) {
        return `Descrição do procedimento ${i + 1} deve ter entre 2 e 120 caracteres`;
      }
      const v = paraNumero(procedimentos[i].valor);
      if (!Number.isFinite(v) || v < 0) {
        return `Valor do procedimento ${i + 1} deve ser maior ou igual a zero`;
      }
    }
    return null;
  }

  async function handleIniciar() {
    setSubmitting(true);
    try {
      await apiIniciarAtendimento(id);
      toast.success("Atendimento iniciado");
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFinalizar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const erro = validarFormulario();
    if (erro) {
      toast.warning(erro);
      return;
    }
    setSubmitting(true);
    try {
      await apiFinalizarAtendimento(id, {
        valorConsulta: valorCobradoNum,
        // FI06: `valorOriginal` NÃO vai no body — o servidor usa o
        // `valorConsultaBase` do profissional como valor de tabela.
        statusPagamento: statusPag,
        motivoDescontoOuGratuidade: motivoObrigatorio
          ? motivoJustificativa.trim()
          : undefined,
        prontuarioInterno: usaProntuarioExterno ? undefined : prontuario,
        usaProntuarioExterno,
        referenciaProntuarioExterno: usaProntuarioExterno
          ? referenciaExterna.trim()
          : null,
        procedimentos: procedimentos.map((p) => ({
          descricao: p.descricao.trim(),
          valor: paraNumero(p.valor),
        })),
      });
      toast.success("Atendimento finalizado");
      setShowFinalize(false);
      await fetchData();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

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
        title={`Atendimento #${atendimento.id.slice(0, 8)}`}
        description={`${formatDateLong(atendimento.data)} · ${atendimento.hora}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {podeIniciar && (
              <Button onClick={handleIniciar} disabled={submitting}>
                <Play size={14} />
                Iniciar atendimento
              </Button>
            )}
            {podeFinalizar && !showFinalize && (
              <Button onClick={() => setShowFinalize(true)} disabled={submitting}>
                <CheckCircle2 size={14} />
                Finalizar e registrar
              </Button>
            )}
            {podeEditar && (
              <Link
                href={`/atendimentos/${id}/editar`}
                className={buttonVariants({ variant: "outline" })}
              >
                <Pencil size={14} />
                Editar
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Informações do atendimento</CardTitle>
                <div className="flex gap-2">
                  <AgendamentoStatusBadge status={atendimento.status} />
                  <PaymentStatusBadge status={atendimento.statusPagamento} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Calendar}
                label="Data"
                value={formatDateLong(atendimento.data)}
              />
              <InfoRow icon={Clock} label="Horário" value={atendimento.hora} />
              <InfoRow
                icon={User}
                label="Paciente"
                value={atendimento.paciente.nome}
              />
              <InfoRow
                icon={FileText}
                label="Profissional"
                value={`${atendimento.profissional.nome} · ${atendimento.profissional.especialidade}`}
              />
              <InfoRow
                icon={DoorOpen}
                label="Consultório"
                value={atendimento.consultorio.nome}
              />
            </CardContent>
          </Card>

          {showFinalize && (
            <Card>
              <CardHeader>
                <CardTitle>Finalizar atendimento</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFinalizar} className="space-y-6">
                  {/* ---- FI06: valor de tabela (do cadastro) x valor cobrado ---- */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="valor">Valor cobrado (R$)</Label>
                        <Input
                          id="valor"
                          type="number"
                          min="0"
                          step="0.01"
                          className="tabular-nums"
                          value={valor}
                          onChange={(e) => setValor(e.target.value)}
                          required
                        />
                        {temValorTabela ? (
                          <p
                            className="text-sm text-muted-foreground"
                            data-testid="valor-tabela"
                          >
                            Valor de tabela:{" "}
                            <span className="font-medium tabular-nums text-foreground">
                              {formatBRL(valorTabelaNum)}
                            </span>
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Profissional sem valor de consulta cadastrado.
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Preço do cadastro de {atendimento.profissional.nome} —
                          cobrar abaixo dele exige justificativa.
                        </p>
                      </div>
                    </div>

                    {temDesconto && (
                      <div className="rounded-xl border border-warning/40 bg-warning/5 p-3">
                        <p className="text-sm font-medium">
                          Desconto concedido:{" "}
                          <span
                            className="tabular-nums"
                            data-testid="desconto-concedido"
                          >
                            {formatBRL(descontoConcedido)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Toda cobrança abaixo do valor de tabela exige
                          justificativa registrada na auditoria.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* ---- Pagamento ---- */}
                  <div>
                    <p className="mb-2 text-sm font-medium">Pagamento</p>
                    <div className="grid grid-cols-3 gap-3">
                      {(["pago", "pendente", "gratuito"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatusPag(s)}
                          // A seleção não pode existir só na cor — o default
                          // "pago" precisa chegar também a leitor de tela.
                          aria-pressed={statusPag === s}
                          className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                            statusPag === s
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {motivoObrigatorio && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-0.5">
                        <Label htmlFor="motivoDescontoOuGratuidade">
                          {ehGratuito
                            ? "Justificativa da gratuidade"
                            : "Justificativa do desconto"}
                        </Label>
                        <span className="text-destructive" aria-hidden="true">
                          *
                        </span>
                      </div>
                      <Input
                        id="motivoDescontoOuGratuidade"
                        value={motivoJustificativa}
                        onChange={(e) =>
                          setMotivoJustificativa(e.target.value)
                        }
                        placeholder={
                          ehGratuito
                            ? "Ex: Paciente encaminhado pela ONG parceira"
                            : "Ex: Paciente retorno em até 30 dias"
                        }
                        aria-required="true"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Obrigatório (mínimo 3 caracteres).
                      </p>
                    </div>
                  )}

                  {/* ---- AT02: procedimentos extras ---- */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          Procedimentos extras
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Entram no total do atendimento e no repasse do
                          profissional.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={adicionarProcedimento}
                        disabled={procedimentos.length >= MAX_PROCEDIMENTOS}
                      >
                        <Plus size={14} />
                        Adicionar procedimento
                      </Button>
                    </div>

                    {procedimentos.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                        <p className="text-sm text-muted-foreground">
                          Nenhum procedimento extra registrado. Use
                          &quot;Adicionar procedimento&quot; para lançar exames
                          ou procedimentos feitos na consulta.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="hidden gap-2 sm:flex">
                          <span className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">
                            Descrição
                          </span>
                          <span className="w-36 shrink-0 text-xs font-medium text-muted-foreground">
                            Valor (R$)
                          </span>
                          <span className="size-10 shrink-0" aria-hidden="true" />
                        </div>
                        {procedimentos.map((linha, index) => (
                          <ProcedimentoRow
                            key={index}
                            index={index}
                            linha={linha}
                            onChange={(nova) =>
                              setProcedimentos((atual) =>
                                atual.map((l, i) => (i === index ? nova : l)),
                              )
                            }
                            onRemove={() =>
                              setProcedimentos((atual) =>
                                atual.filter((_, i) => i !== index),
                              )
                            }
                          />
                        ))}
                      </div>
                    )}

                    <div className="space-y-1 rounded-xl border border-border bg-muted/30 p-3 text-sm tabular-nums">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Consulta</span>
                        <span>{formatBRL(valorCobrado)}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Total dos procedimentos</span>
                        <span data-testid="total-procedimentos">
                          {formatBRL(totalProcedimentos)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-border pt-1 text-base font-semibold">
                        <span>Total geral</span>
                        <span data-testid="total-geral">
                          {formatBRL(totalGeral)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ---- AT04: prontuário interno x externo ---- */}
                  <div className="space-y-3 border-t border-border pt-4">
                    <p className="text-sm font-medium">Prontuário</p>
                    <div
                      role="radiogroup"
                      aria-label="Registro do prontuário"
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    >
                      <TipoProntuarioOption
                        id="prontuario-interno"
                        name="tipo-prontuario"
                        label="Prontuário interno"
                        icon={FileText}
                        checked={!usaProntuarioExterno}
                        onSelect={() => setUsaProntuarioExterno(false)}
                      />
                      <TipoProntuarioOption
                        id="prontuario-externo"
                        name="tipo-prontuario"
                        label="Prontuário externo"
                        icon={ExternalLink}
                        checked={usaProntuarioExterno}
                        onSelect={() => setUsaProntuarioExterno(true)}
                      />
                    </div>

                    {usaProntuarioExterno ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-0.5">
                          <Label htmlFor="referenciaProntuarioExterno">
                            Referência do prontuário externo
                          </Label>
                          <span className="text-destructive" aria-hidden="true">
                            *
                          </span>
                        </div>
                        <Input
                          id="referenciaProntuarioExterno"
                          value={referenciaExterna}
                          onChange={(e) => setReferenciaExterna(e.target.value)}
                          placeholder="Ex: Sistema próprio da Dra. Helena, ficha 4821"
                          aria-required="true"
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Obrigatório (mínimo 3 caracteres). O conteúdo clínico
                          permanece no sistema do profissional.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <ProntuarioField
                          id="prontuario-anamnese"
                          label="Anamnese"
                          value={prontuario.anamnese}
                          onChange={(v) =>
                            setProntuario((p) => ({ ...p, anamnese: v }))
                          }
                        />
                        <ProntuarioField
                          id="prontuario-evolucao"
                          label="Evolução"
                          value={prontuario.evolucao}
                          onChange={(v) =>
                            setProntuario((p) => ({ ...p, evolucao: v }))
                          }
                        />
                        <ProntuarioField
                          id="prontuario-conduta"
                          label="Conduta"
                          value={prontuario.conduta}
                          onChange={(v) =>
                            setProntuario((p) => ({ ...p, conduta: v }))
                          }
                        />
                        <ProntuarioField
                          id="prontuario-retorno"
                          label="Retorno"
                          value={prontuario.retorno}
                          onChange={(v) =>
                            setProntuario((p) => ({ ...p, retorno: v }))
                          }
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowFinalize(false)}
                      disabled={submitting}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      <CheckCircle2 size={14} />
                      {submitting ? "Salvando..." : "Confirmar finalização"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Prontuário registrado</CardTitle>
            </CardHeader>
            <CardContent>
              {atendimento.usaProntuarioExterno ? (
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <Badge variant="info">Prontuário externo</Badge>
                  <p className="mt-3 text-sm">
                    {atendimento.referenciaProntuarioExterno ??
                      "Referência não informada"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    O registro clínico está no sistema próprio do profissional.
                  </p>
                </div>
              ) : atendimento.prontuarioInterno &&
                typeof atendimento.prontuarioInterno === "object" ? (
                <div className="space-y-3 text-sm">
                  {Object.entries(
                    atendimento.prontuarioInterno as Record<string, unknown>,
                  )
                    .filter(([, v]) => typeof v === "string" && v.length > 0)
                    .map(([k, v]) => (
                      <div key={k}>
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {k}
                        </p>
                        <p className="mt-0.5">{String(v)}</p>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6">
                  <Badge variant="warning">
                    Prontuário ainda não preenchido
                  </Badge>
                  <p className="mt-3 text-sm text-muted-foreground">
                    O prontuário será preenchido na finalização do atendimento.
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
              {descontoSalvo > 0 && valorOriginalSalvo != null && (
                <>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Valor de tabela</span>
                    <span>{formatBRL(valorOriginalSalvo)}</span>
                  </div>
                  <div className="flex justify-between text-warning">
                    <span>Desconto concedido</span>
                    <span>-{formatBRL(descontoSalvo)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor da consulta</span>
                <span className="font-medium">
                  {formatBRL(Number(atendimento.valorConsulta))}
                </span>
              </div>
              {procedimentosSalvos.length > 0 && (
                <>
                  <div className="space-y-1 border-t border-border pt-2">
                    {procedimentosSalvos.map((p) => (
                      <div
                        key={p.id}
                        className="flex justify-between gap-3 text-muted-foreground"
                      >
                        <span className="min-w-0 truncate">{p.descricao}</span>
                        <span className="shrink-0">
                          {formatBRL(Number(p.valor))}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Procedimentos</span>
                    <span>{formatBRL(valorProcedimentosSalvo)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between border-t border-border pt-2 text-base">
                <span className="font-semibold">Total do atendimento</span>
                <span className="font-bold">{formatBRL(valorTotalSalvo)}</span>
              </div>
            </CardContent>
          </Card>

          {atendimento.motivoDescontoOuGratuidade && (
            <Card className="border-warning/40 bg-warning/5">
              <CardHeader>
                <CardTitle className="text-sm">Justificativa</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {atendimento.motivoDescontoOuGratuidade}
                </p>
              </CardContent>
            </Card>
          )}

          {atendimento.motivoCancelamento && (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="text-sm">
                  Motivo do cancelamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{atendimento.motivoCancelamento}</p>
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

/** AT02 — uma linha da lista editável de procedimentos extras. */
function ProcedimentoRow({
  index,
  linha,
  onChange,
  onRemove,
}: {
  index: number;
  linha: ProcedimentoLinha;
  onChange: (linha: ProcedimentoLinha) => void;
  onRemove: () => void;
}) {
  const n = index + 1;
  return (
    <div className="flex items-start gap-2">
      <Input
        aria-label={`Descrição do procedimento ${n}`}
        placeholder="Ex: Endoscopia"
        maxLength={120}
        value={linha.descricao}
        onChange={(e) => onChange({ ...linha, descricao: e.target.value })}
        className="min-w-0 flex-1"
      />
      <Input
        aria-label={`Valor do procedimento ${n}`}
        type="number"
        min="0"
        step="0.01"
        placeholder="0,00"
        value={linha.valor}
        onChange={(e) => onChange({ ...linha, valor: e.target.value })}
        className="w-36 shrink-0 tabular-nums"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Remover procedimento ${n}`}
        onClick={onRemove}
        className="shrink-0 hover:text-destructive"
      >
        <Trash2 size={16} />
      </Button>
    </div>
  );
}

/** AT04 — opção do seletor interno/externo (radio nativo + Label htmlFor). */
function TipoProntuarioOption({
  id,
  name,
  label,
  icon: Icon,
  checked,
  onSelect,
}: {
  id: string;
  name: string;
  label: string;
  icon: typeof FileText;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="relative">
      <input
        type="radio"
        id={id}
        name={name}
        className="peer absolute inset-0 z-10 size-full cursor-pointer opacity-0"
        checked={checked}
        onChange={onSelect}
      />
      <Label
        htmlFor={id}
        className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors peer-hover:bg-muted peer-checked:border-primary peer-checked:bg-primary/5 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background"
      >
        <Icon size={14} />
        {label}
      </Label>
    </div>
  );
}

function AtendimentoDetailSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="mb-4 h-4 w-48" />
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-56" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-full" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 5 }).map((_, i) => (
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
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function ProntuarioField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
