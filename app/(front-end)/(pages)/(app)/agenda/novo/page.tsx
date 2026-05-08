"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import { PacienteCombobox } from "@/components/paciente/paciente-combobox";
import {
  apiListProfissionais,
  type Profissional,
} from "@/lib/api/profissionais";
import {
  apiListConsultorios,
  type Consultorio,
} from "@/lib/api/consultorios";
import {
  apiCreateAgendamento,
  apiListAgendamentos,
} from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDateLong } from "@/lib/format";

const HORARIOS_MANHA = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
];
const HORARIOS_TARDE = [
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

function amanhaISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const [pacienteId, setPacienteId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [consultorioId, setConsultorioId] = useState("");
  const [data, setData] = useState(amanhaISO);
  const [horario, setHorario] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiListProfissionais({ ativo: true })
      .then((res) => {
        setProfissionais(res.profissionais);
        if (res.profissionais.length > 0 && !profissionalId) {
          setProfissionalId(res.profissionais[0].id);
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err)));

    apiListConsultorios({ ativo: true })
      .then((res) => {
        setConsultorios(res.consultorios);
        if (res.consultorios.length > 0 && !consultorioId) {
          setConsultorioId(res.consultorios[0].id);
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err)));
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

  const dataLabel = useMemo(() => {
    if (!data) return "—";
    try {
      return formatDateLong(data);
    } catch {
      return data;
    }
  }, [data]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!horario) {
      toast.warning("Escolha um horário disponível");
      return;
    }
    if (!pacienteId) {
      toast.warning("Selecione um paciente");
      return;
    }
    setSubmitting(true);
    try {
      await apiCreateAgendamento({
        pacienteId,
        profissionalId,
        consultorioId,
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
        description="Atendente registra consulta em nome do paciente (AG02)"
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
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="profissional">Profissional</Label>
                  <Select
                    id="profissional"
                    required
                    value={profissionalId}
                    onChange={(e) => setProfissionalId(e.target.value)}
                  >
                    {profissionais.length === 0 && (
                      <option value="">Carregando…</option>
                    )}
                    {profissionais.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {p.especialidade}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="consultorio">Consultório</Label>
                  <Select
                    id="consultorio"
                    required
                    value={consultorioId}
                    onChange={(e) => setConsultorioId(e.target.value)}
                  >
                    {consultorios.length === 0 && (
                      <option value="">Carregando…</option>
                    )}
                    {consultorios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </Select>
                </div>
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
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Manhã</p>
                <div className="grid grid-cols-4 gap-2">
                  {HORARIOS_MANHA.map((h) => {
                    const ocupado = ocupados.has(h);
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

              <div>
                <p className="mb-2 text-sm font-medium">Tarde</p>
                <div className="grid grid-cols-4 gap-2">
                  {HORARIOS_TARDE.map((h) => {
                    const ocupado = ocupados.has(h);
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
              </div>
              <p className="text-xs text-muted-foreground">
                Após confirmar, o sistema bloqueia automaticamente o horário
                (AG05).
              </p>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!horario || submitting}
          >
            <CheckCircle2 size={16} />
            {submitting ? "Salvando..." : "Confirmar agendamento"}
          </Button>
        </aside>
      </form>
    </>
  );
}
