"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import { consultorios } from "@/lib/mock/data";
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

export default function NovoProfissionalPage() {
  const router = useRouter();
  const [modalidade, setModalidade] = useState<"percentual" | "aluguel-fixo">("percentual");
  const [percentual, setPercentual] = useState("30");
  const [aluguel, setAluguel] = useState("180");
  const [turnos, setTurnos] = useState<TurnoFixo[]>([]);

  function addTurno() {
    setTurnos((t) => [
      ...t,
      {
        id: crypto.randomUUID(),
        dia: 1,
        turno: "manha",
        consultorioId: consultorios[0].id,
      },
    ]);
  }

  function updateTurno(id: string, field: keyof TurnoFixo, value: string | number) {
    setTurnos((t) => t.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  }

  function removeTurno(id: string) {
    setTurnos((t) => t.filter((x) => x.id !== id));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success("Profissional cadastrado", {
      description: "Contrato e turnos salvos (protótipo, não persistido).",
    });
    setTimeout(() => router.push("/profissionais"), 600);
  }

  return (
    <>
      <PageHeader
        title="Novo profissional"
        description="Cadastre médico, psicólogo, fisioterapeuta ou outro profissional autônomo da clínica"
        actions={
          <Link href="/profissionais" className={buttonVariants({ variant: "outline" })}>
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
                <Input id="nome" placeholder="Dra. Ana Oliveira" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Select id="especialidade" required defaultValue="Clínica geral">
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
                <Input id="conselho" placeholder="CRM/SP 123456" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="nome@dominio.com" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(11) 90000-0000" required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duracao">Duração padrão da consulta (min)</Label>
                <Input
                  id="duracao"
                  type="number"
                  min="10"
                  step="5"
                  defaultValue="30"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Define o bloco de agenda (AG04).
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select id="status" defaultValue="ativo">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contrato e repasse (FI01 / FI02 / FI08)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
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
                    Clínica recebe % sobre cada consulta realizada
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
                    Profissional paga valor fixo por turno utilizado
                  </p>
                </button>
              </div>

              {modalidade === "percentual" ? (
                <div className="space-y-1.5">
                  <Label htmlFor="percentual">Percentual de repasse à clínica (%)</Label>
                  <Input
                    id="percentual"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={percentual}
                    onChange={(e) => setPercentual(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Ex: 30 significa que 30% do bruto vai para a clínica.
                    Equivale a {formatPercent(Number(percentual) / 100 || 0)}.
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
                    required
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
              <CardTitle>Turnos fixos (AG03 / CO02 / CO03)</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTurno}>
                Adicionar turno
              </Button>
            </CardHeader>
            <CardContent>
              {turnos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum turno configurado. O profissional só poderá atender após
                  definir pelo menos um turno fixo vinculado a um consultório.
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
                          updateTurno(t.id, "turno", e.target.value as TurnoFixo["turno"])
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
                        ×
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
                      ? `Percentual ${formatPercent(Number(percentual) / 100 || 0)}`
                      : `Aluguel ${formatBRL(Number(aluguel) || 0)}/turno`}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Turnos fixos:</span>{" "}
                  <span className="font-medium">{turnos.length}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Após cadastro, o sistema calcula repasses automaticamente a partir dos
                atendimentos vinculados a este profissional.
              </p>
              <Button type="submit" className="w-full" size="lg">
                Cadastrar profissional
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
