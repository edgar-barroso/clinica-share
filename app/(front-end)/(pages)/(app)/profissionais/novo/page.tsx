"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import { apiListConsultorios, type Consultorio } from "@/lib/api/consultorios";
import {
  apiCreateProfissional,
  apiAddTurnoFixo,
  type ModalidadeContrato,
  type Turno,
} from "@/lib/api/profissionais";
import { apiGetTurnos, type TurnosConfig } from "@/lib/api/configuracoes";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatPercent } from "@/lib/format";

const TURNOS_FALLBACK: TurnosConfig = {
  manha: { inicio: "07:00", fim: "12:00" },
  tarde: { inicio: "13:00", fim: "18:00" },
  noite: { inicio: "18:00", fim: "20:00" },
};

function turnosOptions(cfg: TurnosConfig): { value: Turno; label: string }[] {
  return [
    { value: "manha", label: `Manhã (${cfg.manha.inicio}-${cfg.manha.fim})` },
    { value: "tarde", label: `Tarde (${cfg.tarde.inicio}-${cfg.tarde.fim})` },
    { value: "noite", label: `Noite (${cfg.noite.inicio}-${cfg.noite.fim})` },
  ];
}

const DIAS_SEMANA = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
];

interface TurnoLocal {
  id: string;
  diaSemana: number;
  turno: Turno;
  consultorioId: string;
}

export default function NovoProfissionalPage() {
  const router = useRouter();
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("Clínica geral");
  const [conselho, setConselho] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [duracao, setDuracao] = useState("30");
  const [valorConsultaBase, setValorConsultaBase] = useState("220");
  const [modalidade, setModalidade] = useState<ModalidadeContrato>("percentual");
  const [percentual, setPercentual] = useState("30");
  const [aluguel, setAluguel] = useState("180");
  const [turnos, setTurnos] = useState<TurnoLocal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Config de turnos vem de /configuracoes/turnos — labels dos selects
  // refletem o que o admin definiu (ou fallback caso a API falhe).
  const [turnosConfig, setTurnosConfig] = useState<TurnosConfig>(TURNOS_FALLBACK);
  const TURNOS = useMemo(() => turnosOptions(turnosConfig), [turnosConfig]);

  useEffect(() => {
    apiListConsultorios({ ativo: true })
      .then((res) => setConsultorios(res.consultorios))
      .catch((err) => toast.error(apiErrorMessage(err)));
    apiGetTurnos()
      .then((res) => setTurnosConfig(res.turnos))
      .catch(() => {
        // mantém fallback
      });
  }, []);

  function addTurno() {
    if (consultorios.length === 0) {
      toast.warning("Cadastre um consultório antes");
      return;
    }
    setTurnos((t) => [
      ...t,
      {
        id: crypto.randomUUID(),
        diaSemana: 1,
        turno: "manha",
        consultorioId: consultorios[0].id,
      },
    ]);
  }

  function updateTurno<K extends keyof TurnoLocal>(id: string, field: K, value: TurnoLocal[K]) {
    setTurnos((t) => t.map((x) => (x.id === id ? { ...x, [field]: value } : x)));
  }

  function removeTurno(id: string) {
    setTurnos((t) => t.filter((x) => x.id !== id));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { profissional } = await apiCreateProfissional({
        nome,
        especialidade,
        conselho,
        email,
        telefone,
        modalidadeContrato: modalidade,
        percentualRepasse:
          modalidade === "percentual" ? Number(percentual) / 100 : null,
        valorAluguelPorTurno:
          modalidade === "aluguel_fixo" ? Number(aluguel) : null,
        valorConsultaBase: Number(valorConsultaBase) || 0,
        duracaoConsultaMinutos: Number(duracao),
      });

      // Cria turnos em paralelo; se algum falhar (conflito), avisa mas mantém o profissional
      const turnoErrors: string[] = [];
      await Promise.all(
        turnos.map((t) =>
          apiAddTurnoFixo(profissional.id, {
            consultorioId: t.consultorioId,
            diaSemana: t.diaSemana,
            turno: t.turno,
          }).catch((err) => {
            turnoErrors.push(apiErrorMessage(err));
          }),
        ),
      );

      if (turnoErrors.length > 0) {
        toast.warning("Profissional criado, mas turnos com conflito", {
          description: turnoErrors.join(" · "),
        });
      } else {
        toast.success("Profissional cadastrado");
      }
      router.push("/profissionais");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
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
                <Input
                  id="nome"
                  placeholder="Dra. Ana Oliveira"
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
                  required
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
                  placeholder="CRM/SP 123456"
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
                  placeholder="nome@dominio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 90000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
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
                  value={duracao}
                  onChange={(e) => setDuracao(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Define o bloco padrão na agenda.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorBase">Valor base da consulta (R$)</Label>
                <Input
                  id="valorBase"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorConsultaBase}
                  onChange={(e) => setValorConsultaBase(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Valor que o paciente vê ao agendar; pode ser ajustado na
                  finalização do atendimento.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contrato e repasse</CardTitle>
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
                  onClick={() => setModalidade("aluguel_fixo")}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    modalidade === "aluguel_fixo"
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
                    Ex: 30 = 30% do bruto vai para a clínica
                    ({formatPercent(Number(percentual) / 100 || 0)}).
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
              <CardTitle>Turnos fixos</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addTurno}>
                Adicionar turno
              </Button>
            </CardHeader>
            <CardContent>
              {turnos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum turno configurado. Você pode adicionar agora ou depois pela
                  página de detalhe do profissional.
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
                        value={t.diaSemana}
                        onChange={(e) =>
                          updateTurno(t.id, "diaSemana", Number(e.target.value))
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
                          updateTurno(t.id, "turno", e.target.value as Turno)
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
                        onChange={(e) => updateTurno(t.id, "consultorioId", e.target.value)}
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
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Cadastrando..." : "Cadastrar profissional"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
