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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  const [tipoProntuario, setTipoProntuario] = useState<"interno" | "externo">(
    "interno",
  );
  const [prontuario, setProntuario] = useState({
    anamnese: "",
    evolucao: "",
    conduta: "",
    retorno: "",
  });
  // Onde o prontuário é mantido quando 'externo' (ex: sistema próprio
  // do profissional, papel arquivado na sala). Texto livre, opcional.
  const [prontuarioExternoRef, setProntuarioExternoRef] = useState("");

  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiListProfissionais({ ativo: true })
      .then((res) => {
        setProfissionais(res.profissionais);
        if (res.profissionais.length > 0) {
          const primeiro = res.profissionais[0];
          setProfissionalId(primeiro.id);
          // Pré-preenche o valor com a base do profissional selecionado.
          setValorConsulta(String(Number(primeiro.valorConsultaBase)));
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
      // Monta o payload do prontuário conforme o tipo escolhido.
      // - interno: salva os 4 campos preenchidos (omite se todos vazios)
      // - externo: salva uma flag + referência opcional (onde o prontuário fica)
      let prontuarioPayload: Record<string, unknown> | undefined;
      if (tipoProntuario === "externo") {
        prontuarioPayload = {
          tipo: "externo",
          referencia: prontuarioExternoRef.trim() || undefined,
        };
      } else {
        const algum = Object.values(prontuario).some(
          (v) => v.trim().length > 0,
        );
        if (algum) {
          prontuarioPayload = {
            tipo: "interno",
            anamnese: prontuario.anamnese.trim(),
            evolucao: prontuario.evolucao.trim(),
            conduta: prontuario.conduta.trim(),
            retorno: prontuario.retorno.trim(),
          };
        }
      }

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
        prontuarioInterno: prontuarioPayload,
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
                {profissionais.length === 0 ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Select
                    id="profissional"
                    value={profissionalId}
                    onChange={(e) => {
                      const novoId = e.target.value;
                      setProfissionalId(novoId);
                      const prof = profissionais.find((p) => p.id === novoId);
                      if (prof) {
                        setValorConsulta(String(Number(prof.valorConsultaBase)));
                      }
                    }}
                    required
                  >
                    {profissionais.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} — {p.especialidade}
                      </option>
                    ))}
                  </Select>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consultorio">Consultório</Label>
                {consultorios.length === 0 ? (
                  <Skeleton className="h-10 w-full rounded-xl" />
                ) : (
                  <Select
                    id="consultorio"
                    value={consultorioId}
                    onChange={(e) => setConsultorioId(e.target.value)}
                    required
                  >
                    {consultorios.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                  </Select>
                )}
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
              <CardTitle>Prontuário</CardTitle>
              <CardDescription>
                Registro clínico do atendimento. Visível apenas para o
                profissional dono e admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTipoProntuario("interno")}
                  aria-pressed={tipoProntuario === "interno"}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    tipoProntuario === "interno"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">Prontuário interno</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Anamnese, evolução, conduta e retorno gravados aqui.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoProntuario("externo")}
                  aria-pressed={tipoProntuario === "externo"}
                  className={`rounded-xl border p-4 text-left transition-colors ${
                    tipoProntuario === "externo"
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <p className="text-sm font-semibold">Prontuário externo</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Mantido fora do sistema (papel ou outro software).
                  </p>
                </button>
              </div>

              {tipoProntuario === "interno" ? (
                <div className="space-y-4 border-t border-border pt-4">
                  <ProntuarioField
                    id="anamnese"
                    label="Anamnese"
                    placeholder="Queixa principal, histórico, sintomas relatados…"
                    value={prontuario.anamnese}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, anamnese: v }))
                    }
                  />
                  <ProntuarioField
                    id="evolucao"
                    label="Evolução"
                    placeholder="O que foi observado e a evolução do quadro."
                    value={prontuario.evolucao}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, evolucao: v }))
                    }
                  />
                  <ProntuarioField
                    id="conduta"
                    label="Conduta"
                    placeholder="Diagnóstico, prescrições, exames solicitados, orientações."
                    value={prontuario.conduta}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, conduta: v }))
                    }
                  />
                  <ProntuarioField
                    id="retorno"
                    label="Retorno"
                    placeholder="Necessidade e prazo do retorno (ex: 30 dias)."
                    value={prontuario.retorno}
                    onChange={(v) =>
                      setProntuario((p) => ({ ...p, retorno: v }))
                    }
                  />
                </div>
              ) : (
                <div className="space-y-1.5 border-t border-border pt-4">
                  <Label htmlFor="prontuarioRef">
                    Referência do prontuário externo (opcional)
                  </Label>
                  <Input
                    id="prontuarioRef"
                    value={prontuarioExternoRef}
                    onChange={(e) => setProntuarioExternoRef(e.target.value)}
                    placeholder="Ex: Pasta nº 42 · Doctoralia · sistema próprio"
                  />
                  <p className="text-xs text-muted-foreground">
                    Apenas para localização. O conteúdo clínico não é gravado
                    no ClinicaShare.
                  </p>
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

function ProntuarioField({
  id,
  label,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
