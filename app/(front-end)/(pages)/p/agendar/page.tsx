"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiCreateAgendamento,
  apiListAgendamentos,
} from "@/lib/api/agendamentos";
import {
  apiListProfissionais,
  type Profissional,
} from "@/lib/api/profissionais";
import {
  apiListConsultorios,
  type Consultorio,
} from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";

const HORARIOS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
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

export default function AgendarConsultaPage() {
  const router = useRouter();
  const { pacienteId } = useCurrentUser();
  const [profissionalId, setProfissionalId] = useState("");
  const [consultorioId, setConsultorioId] = useState("");
  const [data, setData] = useState(amanhaISO);
  const [hora, setHora] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [ocupados, setOcupados] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiListProfissionais({ ativo: true })
      .then((res) => {
        setProfissionais(res.profissionais);
        if (res.profissionais.length > 0) {
          setProfissionalId(res.profissionais[0].id);
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err)));
    apiListConsultorios({ ativo: true })
      .then((res) => {
        setConsultorios(res.consultorios);
        if (res.consultorios.length > 0) {
          setConsultorioId(res.consultorios[0].id);
        }
      })
      .catch((err) => toast.error(apiErrorMessage(err)));
  }, []);

  useEffect(() => {
    if (!profissionalId || !data) return;
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pacienteId) {
      toast.error("Sua conta paciente não está vinculada");
      return;
    }
    if (!hora) {
      toast.warning("Escolha um horário");
      return;
    }
    setSubmitting(true);
    try {
      await apiCreateAgendamento({
        pacienteId,
        profissionalId,
        consultorioId,
        data,
        hora,
        observacoes: observacoes.trim() || undefined,
      });
      toast.success("Consulta agendada");
      router.push("/p/consultas");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Agendar consulta"
        description="Escolha profissional, data e horário"
        actions={
          <Link href="/p" className={buttonVariants({ variant: "outline" })}>
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
              <CardTitle>1. Profissional e local</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="prof">Profissional</Label>
                <Select
                  id="prof"
                  value={profissionalId}
                  onChange={(e) => setProfissionalId(e.target.value)}
                  required
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
                <Label htmlFor="cons">Consultório</Label>
                <Select
                  id="cons"
                  value={consultorioId}
                  onChange={(e) => setConsultorioId(e.target.value)}
                  required
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
                    setHora(null);
                  }}
                  required
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Horários disponíveis</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {HORARIOS.map((h) => {
                    const ocupado = ocupados.has(h);
                    const sel = hora === h;
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={ocupado}
                        onClick={() => setHora(h)}
                        className={`rounded-xl border px-3 py-2 text-sm font-medium tabular-nums transition-colors ${
                          ocupado
                            ? "border-border bg-muted/50 text-muted-foreground line-through cursor-not-allowed"
                            : sel
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
                rows={3}
                placeholder="Algo que o profissional deveria saber antes da consulta?"
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Confirmar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-xl bg-muted/50 p-3">
                <p>
                  <span className="text-muted-foreground">Data:</span>{" "}
                  <span className="font-medium tabular-nums">{data}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Hora:</span>{" "}
                  <span className="font-medium">
                    {hora ?? <span className="text-warning">— —</span>}
                  </span>
                </p>
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={!hora || submitting}
              >
                <CheckCircle2 size={16} />
                {submitting ? "Agendando..." : "Confirmar agendamento"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
