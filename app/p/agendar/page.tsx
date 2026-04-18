"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Landmark,
  QrCode,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { profissionais } from "@/lib/mock/data";
import { formatBRL, formatDateLong, formatWeekday } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "especialidade", label: "Especialidade" },
  { key: "profissional", label: "Profissional" },
  { key: "data", label: "Data" },
  { key: "horario", label: "Horário" },
  { key: "pagamento", label: "Pagamento" },
] as const;

type StepKey = (typeof STEPS)[number]["key"];

const ESPECIALIDADES = Array.from(
  new Set(profissionais.map((p) => p.especialidade)),
).sort();

const HORARIOS = [
  { periodo: "Manhã", slots: ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00"] },
  { periodo: "Tarde", slots: ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"] },
];

type Pagamento = "pix" | "cartao" | "boleto";

export default function AgendarPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>("especialidade");
  const [especialidade, setEspecialidade] = useState<string | null>(null);
  const [profId, setProfId] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [pagamento, setPagamento] = useState<Pagamento>("pix");

  const profissionaisFiltrados = useMemo(
    () => profissionais.filter((p) => !especialidade || p.especialidade === especialidade),
    [especialidade],
  );

  const profSelecionado = profId ? profissionais.find((p) => p.id === profId) : null;

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  // gera 7 dias a partir de hoje (simulado em 2026-04-18)
  const hoje = new Date("2026-04-19T00:00:00");
  const datasDisponiveis = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() + i);
    return d;
  });

  const slotsOcupados = new Set(["08:30", "14:00", "15:30"]);

  function canAdvance() {
    switch (step) {
      case "especialidade":
        return !!especialidade;
      case "profissional":
        return !!profId;
      case "data":
        return !!data;
      case "horario":
        return !!horario;
      case "pagamento":
        return true;
    }
  }

  function next() {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  }

  function prev() {
    const idx = STEPS.findIndex((s) => s.key === step);
    if (idx > 0) setStep(STEPS[idx - 1].key);
  }

  function finalizar() {
    toast.success("Consulta agendada", {
      description: "Você receberá lembretes via WhatsApp 2 dias e 1 dia antes (AG07).",
    });
    setTimeout(() => router.push("/p/consultas"), 800);
  }

  const valorBase = profSelecionado?.especialidade
    ? profSelecionado.especialidade === "Cardiologia"
      ? 350
      : profSelecionado.especialidade === "Oftalmologia"
        ? 280
        : profSelecionado.especialidade === "Ginecologia"
          ? 300
          : profSelecionado.especialidade === "Psicologia"
            ? 260
            : profSelecionado.especialidade === "Fisioterapia"
              ? 180
              : 220
    : 0;

  return (
    <>
      <Link
        href="/p"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Início
      </Link>

      <p className="text-xs font-medium text-primary">
        Etapa {stepIndex + 1} de {STEPS.length}
      </p>
      <h1 className="mt-1 text-2xl font-bold">
        {step === "especialidade" && "Escolha a especialidade"}
        {step === "profissional" && "Escolha o profissional"}
        {step === "data" && "Escolha a data"}
        {step === "horario" && "Escolha o horário"}
        {step === "pagamento" && "Pagamento"}
      </h1>

      <div className="mt-3 mb-6 flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s.key}
            className={cn(
              "h-1 flex-1 rounded-full",
              i <= stepIndex ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      {step === "especialidade" && (
        <div className="grid grid-cols-2 gap-3">
          {ESPECIALIDADES.map((esp) => {
            const active = especialidade === esp;
            return (
              <button
                key={esp}
                type="button"
                onClick={() => setEspecialidade(esp)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <div
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl",
                    active ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Stethoscope size={16} />
                </div>
                <span className="text-sm font-medium">{esp}</span>
              </button>
            );
          })}
        </div>
      )}

      {step === "profissional" && (
        <div className="space-y-3">
          {profissionaisFiltrados.map((p) => {
            const active = profId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfId(p.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                  {p.nome
                    .split(" ")
                    .filter((x) => !["Dr.", "Dra."].includes(x))
                    .map((x) => x[0])
                    .slice(0, 2)
                    .join("")}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.especialidade} · {p.conselho}
                  </p>
                </div>
                {active && <Check size={18} className="text-primary" />}
              </button>
            );
          })}
        </div>
      )}

      {step === "data" && (
        <div className="space-y-3">
          {datasDisponiveis.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const active = data === iso;
            return (
              <button
                key={iso}
                type="button"
                onClick={() => setData(iso)}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl border p-4 transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted",
                )}
              >
                <div className="text-left">
                  <p className="text-sm font-semibold capitalize">{formatWeekday(d)}</p>
                  <p className="text-xs text-muted-foreground">{formatDateLong(d)}</p>
                </div>
                {active && (
                  <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check size={14} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {step === "horario" && (
        <div className="space-y-5">
          {HORARIOS.map((bloco) => (
            <div key={bloco.periodo}>
              <p className="mb-2 text-sm font-medium">{bloco.periodo}</p>
              <div className="grid grid-cols-3 gap-2">
                {bloco.slots.map((h) => {
                  const ocupado = slotsOcupados.has(h);
                  const active = horario === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      disabled={ocupado}
                      onClick={() => setHorario(h)}
                      className={cn(
                        "rounded-2xl border px-3 py-3 text-sm font-medium tabular-nums transition-colors",
                        ocupado
                          ? "cursor-not-allowed border-border bg-muted/60 text-muted-foreground line-through"
                          : active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:bg-muted",
                      )}
                    >
                      {h}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {step === "pagamento" && (
        <div className="space-y-5">
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Resumo do agendamento
              </p>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Especialidade:</span>{" "}
                  <span className="font-medium">{especialidade}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Profissional:</span>{" "}
                  <span className="font-medium">{profSelecionado?.nome}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Data:</span>{" "}
                  <span className="font-medium">
                    {data && formatDateLong(data)}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Horário:</span>{" "}
                  <span className="font-medium tabular-nums">{horario}</span>
                </p>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatBRL(valorBase)}</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <p className="mb-2 text-sm font-semibold">Forma de pagamento (FI09)</p>
            <div className="grid grid-cols-3 gap-2">
              <PaymentOption
                active={pagamento === "pix"}
                onClick={() => setPagamento("pix")}
                icon={QrCode}
                label="Pix"
                hint="Aprovação em 1s"
              />
              <PaymentOption
                active={pagamento === "cartao"}
                onClick={() => setPagamento("cartao")}
                icon={CreditCard}
                label="Cartão"
                hint="Parcele em até 3x"
              />
              <PaymentOption
                active={pagamento === "boleto"}
                onClick={() => setPagamento("boleto")}
                icon={Landmark}
                label="Boleto"
                hint="Até 2 dias úteis"
              />
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-24 mt-8 flex gap-2 bg-background pt-2">
        {stepIndex > 0 && (
          <Button variant="outline" onClick={prev} className="flex-1">
            Voltar
          </Button>
        )}
        {step !== "pagamento" ? (
          <Button
            onClick={next}
            disabled={!canAdvance()}
            className="flex-1"
            size="lg"
          >
            Continuar
          </Button>
        ) : (
          <Button onClick={finalizar} className="flex-1" size="lg">
            Confirmar e pagar
          </Button>
        )}
      </div>
    </>
  );
}

function PaymentOption({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof QrCode;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted",
      )}
    >
      <Icon size={18} className={active ? "text-primary" : "text-muted-foreground"} />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-[10px] text-muted-foreground">{hint}</span>
    </button>
  );
}
