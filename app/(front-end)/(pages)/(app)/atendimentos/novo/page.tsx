"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { CheckCircle2, ShieldAlert } from "lucide-react";
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
  apiCreateWalkIn,
  type FinalizarAtendimentoInput,
} from "@/lib/api/atendimentos";
import { apiErrorMessage } from "@/lib/api-client";

function hojeISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function NovoAtendimentoPage() {
  const router = useRouter();

  const [pacienteId, setPacienteId] = useState("");
  const [profissionalId, setProfissionalId] = useState("");
  const [consultorioId, setConsultorioId] = useState("");
  const [data, setData] = useState(hojeISO);
  const [hora, setHora] = useState("09:00");
  const [valorConsulta, setValorConsulta] = useState("250");
  const [statusPagamento, setStatusPagamento] =
    useState<FinalizarAtendimentoInput["statusPagamento"]>("pago");
  const [motivo, setMotivo] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
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

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!pacienteId) {
      toast.warning("Selecione um paciente");
      return;
    }
    if (statusPagamento === "gratuito" && motivo.trim().length < 3) {
      toast.warning("Motivo é obrigatório para atendimento gratuito");
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateWalkIn({
        pacienteId,
        profissionalId,
        consultorioId,
        data,
        hora,
        valorConsulta: Number(valorConsulta) || 0,
        statusPagamento,
        motivoDescontoOuGratuidade:
          statusPagamento === "gratuito" ? motivo.trim() : undefined,
        observacoes: observacoes.trim() || undefined,
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
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
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
                <Select
                  id="profissional"
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
                <Label htmlFor="consultorio">Consultório</Label>
                <Select
                  id="consultorio"
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
              <div className="space-y-1.5">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hora">Horário</Label>
                <Input
                  id="hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="valor">Valor da consulta (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorConsulta}
                  onChange={(e) => setValorConsulta(e.target.value)}
                  required
                />
              </div>
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
              {statusPagamento === "gratuito" && (
                <div className="space-y-1.5">
                  <Label htmlFor="motivo">
                    Justificativa da gratuidade                  </Label>
                  <Input
                    id="motivo"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ex: Cortesia para filho de funcionário"
                    required
                  />
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
            disabled={submitting || !pacienteId}
          >
            <CheckCircle2 size={16} />
            {submitting ? "Salvando..." : "Registrar atendimento"}
          </Button>
        </aside>
      </form>
    </>
  );
}
