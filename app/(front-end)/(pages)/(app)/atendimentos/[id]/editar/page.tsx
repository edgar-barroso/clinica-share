"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetAtendimento,
  apiUpdateAtendimento,
  type AtendimentoDetail,
  type StatusPagamento,
} from "@/lib/api/atendimentos";
import { apiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";

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
  const [statusPag, setStatusPag] = useState<StatusPagamento>("pago");
  const [motivoGratuidade, setMotivoGratuidade] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [motivoEdicao, setMotivoEdicao] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { atendimento } = await apiGetAtendimento(id);
      setAtendimento(atendimento);
      setValor(String(atendimento.valorConsulta));
      setStatusPag(atendimento.statusPagamento);
      setMotivoGratuidade(atendimento.motivoDescontoOuGratuidade ?? "");
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
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando…
      </p>
    );
  }

  if (role !== "admin" && role !== "auxiliar") {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium">
          Apenas admin e auxiliar podem editar atendimentos pós-realizado
          (PEND-031).
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atendimento) return;
    if (motivoEdicao.trim().length < 3) {
      toast.warning("Motivo da edição é obrigatório (mínimo 3 caracteres)");
      return;
    }
    setSubmitting(true);
    try {
      await apiUpdateAtendimento(id, {
        valorConsulta: Number(valor) || 0,
        statusPagamento: statusPag,
        motivoDescontoOuGratuidade:
          statusPag === "gratuito" ? motivoGratuidade.trim() : null,
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
        description="Edição pós-realizado (FI11) — toda alteração é auditada (RNF-102)"
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
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor cobrado (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                />
              </div>
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
              {statusPag === "gratuito" && (
                <div className="space-y-1.5">
                  <Label htmlFor="motivoGratuidade">
                    Justificativa da gratuidade (FI06)
                  </Label>
                  <Input
                    id="motivoGratuidade"
                    value={motivoGratuidade}
                    onChange={(e) => setMotivoGratuidade(e.target.value)}
                    required
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
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
            <CardContent>
              <Input
                value={motivoEdicao}
                onChange={(e) => setMotivoEdicao(e.target.value)}
                placeholder="Ex: Cliente alegou cobrança duplicada"
                required
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Esta justificativa fica gravada em AuditLog junto com o nome do
                usuário, valor antes e depois da alteração (RNF-102 / RF-025).
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
