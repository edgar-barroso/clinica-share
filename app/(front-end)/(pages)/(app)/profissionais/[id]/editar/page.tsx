"use client";

import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { use, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ShieldAlert, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/layouts/page-header";
import { consultorios, getProfissional } from "@/lib/mock/data";
import { useCurrentUser } from "@/lib/current-user";
import { formatBRL, formatPercent } from "@/lib/format";

const TURNOS = [
  { value: "manha", label: "Manhã (07h-12h)" },
  { value: "tarde", label: "Tarde (13h-18h)" },
  { value: "noite", label: "Noite (18h-20h)" },
] as const;

const DIAS_SEMANA = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
];

interface TurnoFixo {
  id: string;
  dia: number;
  turno: "manha" | "tarde" | "noite";
  consultorioId: string;
}

export default function EditarProfissionalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const original = getProfissional(id);
  if (!original) notFound();
  const router = useRouter();
  const { role, profissionalId } = useCurrentUser();

  const isProfissional = role === "profissional";
  const isOwnProfile = isProfissional && profissionalId === id;
  const isOtherProfissional = isProfissional && profissionalId !== id;

  const [nome, setNome] = useState(original.nome);
  const [especialidade, setEspecialidade] = useState(original.especialidade);
  const [conselho, setConselho] = useState(original.conselho);
  const [email, setEmail] = useState(original.email);
  const [telefone, setTelefone] = useState(original.telefone);
  const [duracao, setDuracao] = useState(String(original.duracaoConsultaMinutos));
  const [ativo, setAtivo] = useState(original.ativo);
  const [modalidade, setModalidade] = useState<"percentual" | "aluguel-fixo">(
    original.modalidadeContrato,
  );
  const [percentual, setPercentual] = useState(
    String(Math.round((original.percentualRepasse ?? 0) * 100)),
  );
  const [aluguel, setAluguel] = useState(
    String(original.valorAluguelPorTurno ?? 0),
  );
  const [turnos, setTurnos] = useState<TurnoFixo[]>(
    original.turnosFixos.map((t, i) => ({
      id: `t${i}`,
      dia: t.dia,
      turno: t.turno,
      consultorioId: t.consultorioId,
    })),
  );

  function addTurno() {
    setTurnos((arr) => [
      ...arr,
      {
        id: crypto.randomUUID(),
        dia: 1,
        turno: "manha",
        consultorioId: consultorios[0].id,
      },
    ]);
  }

  function updateTurno(id: string, field: keyof TurnoFixo, v: string | number) {
    setTurnos((arr) => arr.map((t) => (t.id === id ? { ...t, [field]: v } : t)));
  }

  function removeTurno(id: string) {
    setTurnos((arr) => arr.filter((t) => t.id !== id));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Alterações salvas", {
      description: "Audit log registrado para cada campo alterado.",
    });
    setTimeout(() => router.push(`/profissionais/${id}`), 600);
  }

  if (isOtherProfissional) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium">
          Você só pode editar o seu próprio perfil.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          O cadastro de outros profissionais é gerenciado pelo administrativo.
        </p>
        <Link
          href="/minha-agenda"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para minha agenda
        </Link>
      </div>
    );
  }

  if (isOwnProfile) {
    return (
      <>
        <PageHeader
          title="Meu perfil"
          description="Configure preferências da sua agenda. Contrato, turnos fixos e status são gerenciados pelo administrativo."
          actions={
            <Link
              href="/minha-agenda"
              className={buttonVariants({ variant: "outline" })}
            >
              Cancelar
            </Link>
          }
        />

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-3"
        >
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Identificação</CardTitle>
                <CardDescription>
                  Dados cadastrais — alterações precisam passar pelo administrativo.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ReadonlyField label="Nome" value={original.nome} />
                <ReadonlyField
                  label="Especialidade"
                  value={original.especialidade}
                />
                <ReadonlyField
                  label="Conselho profissional"
                  value={original.conselho}
                />
                <ReadonlyField label="E-mail" value={original.email} />
                <ReadonlyField label="Telefone" value={original.telefone} />
                <ReadonlyField
                  label="Status"
                  value={original.ativo ? "Ativo" : "Inativo"}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duração da consulta</CardTitle>
                <CardDescription>
                  Tempo padrão usado para gerar slots na sua agenda. Altera quanto
                  o sistema reserva por consulta.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 sm:max-w-xs">
                  <Label htmlFor="duracao">Duração (minutos) *</Label>
                  <Input
                    id="duracao"
                    type="number"
                    min="10"
                    step="5"
                    value={duracao}
                    onChange={(e) => setDuracao(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Mínimo 10 minutos · valores em múltiplos de 5.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-xl bg-muted/50 p-3 text-xs">
                  <p>
                    <span className="text-muted-foreground">
                      Duração atual:
                    </span>{" "}
                    <span className="font-medium tabular-nums">
                      {original.duracaoConsultaMinutos} min
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Nova duração:</span>{" "}
                    <span className="font-medium tabular-nums">
                      {duracao} min
                    </span>
                  </p>
                </div>
                <Button type="submit" className="w-full" size="lg">
                  Salvar alterações
                </Button>
              </CardContent>
            </Card>
          </aside>
        </form>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Editar ${original.nome}`}
        description="Atualize dados, contrato e turnos do profissional"
        actions={
          <Link
            href={`/profissionais/${id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais e profissionais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Select
                  id="especialidade"
                  value={especialidade}
                  onChange={(e) => setEspecialidade(e.target.value)}
                >
                  <option>Clínica geral</option>
                  <option>Cardiologia</option>
                  <option>Dermatologia</option>
                  <option>Fisioterapia</option>
                  <option>Ginecologia</option>
                  <option>Nutrição</option>
                  <option>Oftalmologia</option>
                  <option>Pediatria</option>
                  <option>Psicologia</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conselho">Conselho profissional</Label>
                <Input
                  id="conselho"
                  value={conselho}
                  onChange={(e) => setConselho(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duracao">Duração da consulta (min)</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="10"
                  step="5"
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={ativo ? "ativo" : "inativo"}
                  onChange={(e) => setAtivo(e.target.value === "ativo")}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contrato e repasse</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setModalidade("percentual")}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    modalidade === "percentual"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">Percentual</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Clínica recebe % sobre atendimentos
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setModalidade("aluguel-fixo")}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    modalidade === "aluguel-fixo"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">Aluguel fixo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Valor fixo por turno utilizado
                  </p>
                </button>
              </div>

              {modalidade === "percentual" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="perc">Percentual (%)</Label>
                  <Input
                    id="perc"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={percentual}
                    onChange={(e) => setPercentual(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Equivale a {formatPercent(Number(percentual) / 100 || 0)} sobre
                    receita bruta.
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="aluguel">Aluguel por turno (R$)</Label>
                  <Input
                    id="aluguel"
                    type="number"
                    min="0"
                    step="0.01"
                    value={aluguel}
                    onChange={(e) => setAluguel(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    {formatBRL(Number(aluguel) || 0)} a cada turno ocupado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Turnos fixos</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTurno}>
                Adicionar turno
              </Button>
            </CardHeader>
            <CardContent>
              {turnos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Sem turnos configurados.
                </p>
              ) : (
                <div className="space-y-3">
                  {turnos.map((t) => (
                    <div
                      key={t.id}
                      className="grid grid-cols-12 gap-2 rounded-xl border border-border p-3"
                    >
                      <Select
                        className="col-span-3"
                        value={t.dia}
                        onChange={(e) =>
                          updateTurno(t.id, "dia", Number(e.target.value))
                        }
                      >
                        {DIAS_SEMANA.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        className="col-span-4"
                        value={t.turno}
                        onChange={(e) =>
                          updateTurno(
                            t.id,
                            "turno",
                            e.target.value as TurnoFixo["turno"],
                          )
                        }
                      >
                        {TURNOS.map((tr) => (
                          <option key={tr.value} value={tr.value}>
                            {tr.label}
                          </option>
                        ))}
                      </Select>
                      <Select
                        className="col-span-4"
                        value={t.consultorioId}
                        onChange={(e) =>
                          updateTurno(t.id, "consultorioId", e.target.value)
                        }
                      >
                        {consultorios.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome}
                          </option>
                        ))}
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="col-span-1"
                        onClick={() => removeTurno(t.id)}
                        aria-label="Remover turno"
                      >
                        <Trash2 size={14} />
                      </Button>
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
              <div className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-xs">
                <p>
                  <span className="text-muted-foreground">Contrato:</span>{" "}
                  <span className="font-medium">
                    {modalidade === "percentual"
                      ? `% ${percentual}`
                      : `Aluguel ${formatBRL(Number(aluguel) || 0)}`}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Turnos:</span>{" "}
                  <span className="font-medium">{turnos.length}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="font-medium">{ativo ? "Ativo" : "Inativo"}</span>
                </p>
              </div>
              <Button type="submit" className="w-full" size="lg">
                Salvar alterações
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}

function ReadonlyField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  );
}
