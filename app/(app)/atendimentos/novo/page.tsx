"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, Textarea } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import { consultorios, pacientes, profissionais } from "@/lib/mock/data";
import { formatBRL } from "@/lib/format";

interface ProcedimentoRow {
  id: string;
  nome: string;
  valor: string;
}

export default function NovoAtendimentoPage() {
  const router = useRouter();
  const [valorConsulta, setValorConsulta] = useState("280");
  const [procedimentos, setProcedimentos] = useState<ProcedimentoRow[]>([]);
  const [statusPagamento, setStatusPagamento] = useState<"pago" | "pendente" | "gratuito">(
    "pendente",
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Atendimento registrado", {
      description: "Este é um protótipo — o registro não foi persistido.",
    });
    setTimeout(() => router.push("/atendimentos"), 600);
  }

  function addProcedimento() {
    setProcedimentos((p) => [...p, { id: crypto.randomUUID(), nome: "", valor: "" }]);
  }
  function removeProcedimento(id: string) {
    setProcedimentos((p) => p.filter((x) => x.id !== id));
  }
  function updateProcedimento(id: string, field: "nome" | "valor", v: string) {
    setProcedimentos((p) => p.map((x) => (x.id === id ? { ...x, [field]: v } : x)));
  }

  const totalProcedimentos = procedimentos.reduce(
    (s, p) => s + (Number(p.valor) || 0),
    0,
  );
  const total = (Number(valorConsulta) || 0) + totalProcedimentos;

  return (
    <>
      <PageHeader
        title="Registrar atendimento"
        description="Preencha os dados da consulta realizada. Procedimentos extras e descontos são opcionais."
        actions={
          <Link href="/atendimentos" className={buttonVariants({ variant: "outline" })}>
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados do atendimento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  defaultValue="2026-04-13"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hora">Horário</Label>
                <Input id="hora" type="time" defaultValue="09:00" required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="paciente">Paciente</Label>
                <Select id="paciente" required defaultValue="pt01">
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.telefone}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profissional">Profissional</Label>
                <Select id="profissional" required defaultValue="p01">
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.especialidade}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consultorio">Consultório</Label>
                <Select id="consultorio" required defaultValue="c03">
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} — {c.tipo}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorConsulta">Valor da consulta (R$)</Label>
                <Input
                  id="valorConsulta"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorConsulta}
                  onChange={(e) => setValorConsulta(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prontuarioExterno">Prontuário</Label>
                <Select id="prontuarioExterno" defaultValue="interno">
                  <option value="interno">Prontuário do ClinicaShare</option>
                  <option value="externo">Profissional usa prontuário externo</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Procedimentos extras</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addProcedimento}
              >
                <Plus size={14} />
                Adicionar procedimento
              </Button>
            </CardHeader>
            <CardContent>
              {procedimentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum procedimento extra adicionado. Use este bloco para registrar
                  ultrassom, exames e outros itens que geram repasse.
                </p>
              ) : (
                <div className="space-y-3">
                  {procedimentos.map((p) => (
                    <div key={p.id} className="grid grid-cols-12 gap-2">
                      <Input
                        className="col-span-7"
                        placeholder="Ex: Ultrassom transvaginal"
                        value={p.nome}
                        onChange={(e) => updateProcedimento(p.id, "nome", e.target.value)}
                      />
                      <Input
                        className="col-span-4"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Valor"
                        value={p.valor}
                        onChange={(e) => updateProcedimento(p.id, "valor", e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="col-span-1"
                        onClick={() => removeProcedimento(p.id)}
                        aria-label="Remover"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              {(statusPagamento === "gratuito" || statusPagamento === "pendente") && (
                <div className="space-y-1.5">
                  <Label htmlFor="motivo">
                    {statusPagamento === "gratuito"
                      ? "Justificativa da gratuidade (obrigatório)"
                      : "Observação sobre o pagamento (opcional)"}
                  </Label>
                  <Textarea
                    id="motivo"
                    placeholder={
                      statusPagamento === "gratuito"
                        ? "Ex: Cortesia para filho de funcionário"
                        : "Ex: Paciente pagará por boleto gerado amanhã"
                    }
                    required={statusPagamento === "gratuito"}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Consulta</span>
                <span className="font-medium tabular-nums">
                  {formatBRL(Number(valorConsulta) || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Procedimentos ({procedimentos.length})
                </span>
                <span className="font-medium tabular-nums">
                  {formatBRL(totalProcedimentos)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base">
                <span className="font-semibold">Bruto do atendimento</span>
                <span className="font-bold tabular-nums">{formatBRL(total)}</span>
              </div>
              <p className="pt-2 text-xs text-muted-foreground">
                O repasse será calculado no servidor após o fechamento semanal, com base
                no contrato do profissional.
              </p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg">
            Registrar atendimento
          </Button>
        </aside>
      </form>
    </>
  );
}
