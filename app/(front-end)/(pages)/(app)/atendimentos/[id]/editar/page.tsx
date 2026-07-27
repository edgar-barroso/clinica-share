"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetAtendimento,
  apiUpdateAtendimento,
  type AtendimentoDetail,
  type StatusPagamento,
} from "@/lib/api/atendimentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";

/** AT02 — linha editável de procedimento extra (valor como string no input). */
interface ProcedimentoLinha {
  descricao: string;
  valor: string;
}

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

export default function EditarAtendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { role, loading: userLoading } = useCurrentUser();

  const [atendimento, setAtendimento] = useState<AtendimentoDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [valor, setValor] = useState("");
  const [valorTabela, setValorTabela] = useState("");
  const [statusPag, setStatusPag] = useState<StatusPagamento>("pago");
  const [motivoJustificativa, setMotivoJustificativa] = useState("");
  const [procedimentos, setProcedimentos] = useState<ProcedimentoLinha[]>([]);
  const [usaProntuarioExterno, setUsaProntuarioExterno] = useState(false);
  const [referenciaExterna, setReferenciaExterna] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [motivoEdicao, setMotivoEdicao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { atendimento } = await apiGetAtendimento(id);
      setAtendimento(atendimento);
      setValor(String(atendimento.valorConsulta));
      setValorTabela(
        String(atendimento.valorOriginal ?? atendimento.valorConsulta),
      );
      setStatusPag(atendimento.statusPagamento);
      setMotivoJustificativa(atendimento.motivoDescontoOuGratuidade ?? "");
      setProcedimentos(
        (atendimento.procedimentos ?? []).map((p) => ({
          descricao: p.descricao,
          valor: String(p.valor),
        })),
      );
      setUsaProntuarioExterno(atendimento.usaProntuarioExterno ?? false);
      setReferenciaExterna(atendimento.referenciaProntuarioExterno ?? "");
      setObservacoes(atendimento.observacoes ?? "");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (userLoading || loading) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
          <aside className="lg:col-span-1">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (role !== "admin" && role !== "auxiliar") {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium">
          Apenas admin e auxiliar podem editar atendimentos pós-realizado.
        </p>
        <Link
          href={`/atendimentos/${id}`}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para o atendimento
        </Link>
      </div>
    );
  }

  if (!atendimento) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Atendimento não encontrado.
      </p>
    );
  }

  if (atendimento.status !== "realizado") {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium">
          Edição pós-realizado só é possível em atendimentos com status
          &quot;realizado&quot;.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Status atual: {atendimento.status}
        </p>
        <Link
          href={`/atendimentos/${id}`}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para o atendimento
        </Link>
      </div>
    );
  }

  // --- FI04/FI06: totais ao vivo do formulário -----------------------------
  const valorCobradoNum = paraNumero(valor);
  const valorCobrado = Number.isFinite(valorCobradoNum) ? valorCobradoNum : 0;
  const valorTabelaNum = paraNumero(valorTabela);
  const totalProcedimentos = somaProcedimentos(procedimentos);
  const totalGeral = valorCobrado + totalProcedimentos;
  const temDesconto =
    valorTabela.trim() !== "" &&
    Number.isFinite(valorTabelaNum) &&
    valorTabelaNum > valorCobrado;
  const descontoConcedido = temDesconto ? valorTabelaNum - valorCobrado : 0;
  const ehGratuito = statusPag === "gratuito";
  const motivoObrigatorio = temDesconto || ehGratuito;

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

  /** Mesmas regras do servidor — evita o 422 e dá feedback imediato. */
  function validarFormulario(): string | null {
    if (motivoEdicao.trim().length < 3) {
      return "Motivo da edição é obrigatório (mínimo 3 caracteres)";
    }
    if (!Number.isFinite(valorCobradoNum) || valorCobradoNum < 0) {
      return "Informe um valor cobrado válido";
    }
    if (valorTabela.trim() !== "") {
      if (!Number.isFinite(valorTabelaNum) || valorTabelaNum < 0) {
        return "Informe um valor de tabela válido";
      }
      if (valorTabelaNum < valorCobradoNum) {
        return "O valor de tabela não pode ser menor que o valor cobrado";
      }
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atendimento) return;
    const erro = validarFormulario();
    if (erro) {
      toast.warning(erro);
      return;
    }
    setSubmitting(true);
    try {
      await apiUpdateAtendimento(id, {
        valorConsulta: valorCobradoNum,
        valorOriginal: temDesconto ? valorTabelaNum : undefined,
        statusPagamento: statusPag,
        motivoDescontoOuGratuidade: motivoObrigatorio
          ? motivoJustificativa.trim()
          : null,
        usaProntuarioExterno,
        referenciaProntuarioExterno: usaProntuarioExterno
          ? referenciaExterna.trim()
          : null,
        procedimentos: procedimentos.map((p) => ({
          descricao: p.descricao.trim(),
          valor: paraNumero(p.valor),
        })),
        observacoes: observacoes.trim() || null,
        motivo: motivoEdicao.trim(),
      });
      toast.success("Atendimento atualizado");
      router.push(`/atendimentos/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Link
        href={`/atendimentos/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para o atendimento
      </Link>

      <PageHeader
        title={`Editar atendimento #${id.slice(0, 8)}`}
        description="Edição pós-realizado — toda alteração é auditada"
      />

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* ---- FI06: valor de tabela x valor cobrado ---- */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="valorTabela">Valor de tabela (R$)</Label>
                  <Input
                    id="valorTabela"
                    type="number"
                    min="0"
                    step="0.01"
                    className="tabular-nums"
                    value={valorTabela}
                    onChange={(e) => setValorTabela(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Preço cheio da consulta, antes de qualquer desconto.
                  </p>
                </div>
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
                    Toda cobrança abaixo do valor de tabela exige justificativa
                    registrada na auditoria.
                  </p>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">Status</p>
                <div className="grid grid-cols-3 gap-3">
                  {(["pago", "pendente", "gratuito"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusPag(s)}
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
                    onChange={(e) => setMotivoJustificativa(e.target.value)}
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
            </CardContent>
          </Card>

          {/* ---- AT02: procedimentos extras ---- */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle>Procedimentos extras</CardTitle>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Entram no total do atendimento e no repasse do profissional.
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
            </CardHeader>
            <CardContent className="space-y-3">
              {procedimentos.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">
                    Nenhum procedimento extra registrado. Use &quot;Adicionar
                    procedimento&quot; para lançar exames ou procedimentos feitos
                    na consulta.
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
                  <span data-testid="total-geral">{formatBRL(totalGeral)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ---- AT04: prontuário interno x externo ---- */}
          <Card>
            <CardHeader>
              <CardTitle>Prontuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <p className="text-sm text-muted-foreground">
                  O conteúdo clínico (anamnese, evolução, conduta e retorno) é
                  registrado pelo profissional na tela do atendimento e não é
                  alterado por aqui.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Label htmlFor="observacoes">Observações</Label>
              <textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </CardContent>
          </Card>

          <Card className="border-warning/40 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-sm">
                Motivo da edição (obrigatório — auditoria)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <Label htmlFor="motivoEdicao">Motivo da edição</Label>
              <Input
                id="motivoEdicao"
                value={motivoEdicao}
                onChange={(e) => setMotivoEdicao(e.target.value)}
                placeholder="Ex: Cliente alegou cobrança duplicada"
                aria-required="true"
                required
              />
              <p className="text-xs text-muted-foreground">
                Esta justificativa fica gravada na auditoria junto com o nome do
                usuário, valor antes e depois da alteração.
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <div className="flex flex-col gap-2">
            <Button type="submit" size="lg" disabled={submitting}>
              {submitting ? "Salvando..." : "Salvar alterações"}
            </Button>
            <Link
              href={`/atendimentos/${id}`}
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Cancelar
            </Link>
          </div>
        </aside>
      </form>
    </>
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
