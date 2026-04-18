"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Check,
  CreditCard,
  Landmark,
  QrCode,
  Stethoscope,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";
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

function initials(name: string) {
  const parts = name.split(" ").filter((x) => !["Dr.", "Dra."].includes(x));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function AgendarPage() {
  const router = useRouter();
  const [step, setStep] = useState<StepKey>("especialidade");
  const [especialidade, setEspecialidade] = useState<string | null>(null);
  const [profId, setProfId] = useState<string | null>(null);
  const [data, setData] = useState<string | null>(null);
  const [horario, setHorario] = useState<string | null>(null);
  const [pagamento, setPagamento] = useState<Pagamento>("pix");

  const profissionaisFiltrados = useMemo(
    () =>
      profissionais.filter(
        (p) => !especialidade || p.especialidade === especialidade,
      ),
    [especialidade],
  );
  const profSelecionado = profId
    ? profissionais.find((p) => p.id === profId)
    : null;
  const stepIndex = STEPS.findIndex((s) => s.key === step);

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
      description:
        "Você receberá lembretes via WhatsApp 2 dias e 1 dia antes (AG07).",
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
      <PageHeader
        title="Agendar consulta"
        description="Escolha a especialidade, o profissional, o horário e a forma de pagamento (AG01 + FI09)"
        actions={
          <Link href="/p" className={buttonVariants({ variant: "outline" })}>
            Cancelar
          </Link>
        }
      />

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between text-sm">
          <p className="font-medium text-primary">
            Etapa {stepIndex + 1} de {STEPS.length}
          </p>
          <p className="text-muted-foreground">{STEPS[stepIndex].label}</p>
        </div>
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                i <= stepIndex ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === "pagamento") finalizar();
          else if (canAdvance()) next();
        }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {step === "especialidade" && "Qual especialidade você precisa?"}
                {step === "profissional" && "Escolha o profissional"}
                {step === "data" && "Qual data prefere?"}
                {step === "horario" && "Escolha o horário"}
                {step === "pagamento" && "Forma de pagamento"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {step === "especialidade" && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ESPECIALIDADES.map((esp) => {
                    const active = especialidade === esp;
                    return (
                      <button
                        key={esp}
                        type="button"
                        onClick={() => setEspecialidade(esp)}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-9 items-center justify-center rounded-xl",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/10 text-primary",
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
                          "flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                          {initials(p.nome)}
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
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                  {datasDisponiveis.map((d) => {
                    const iso = d.toISOString().slice(0, 10);
                    const active = data === iso;
                    return (
                      <button
                        key={iso}
                        type="button"
                        onClick={() => setData(iso)}
                        className={cn(
                          "rounded-xl border p-3 text-left transition-colors",
                          active
                            ? "border-primary bg-primary/5"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <p className="text-xs font-medium capitalize text-muted-foreground">
                          {formatWeekday(d)}
                        </p>
                        <p className="mt-1 text-sm font-semibold">
                          {formatDateLong(d)}
                        </p>
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
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
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
                                "rounded-xl border px-3 py-3 text-sm font-medium tabular-nums transition-colors",
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
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <PaymentOption
                    active={pagamento === "pix"}
                    onClick={() => setPagamento("pix")}
                    icon={QrCode}
                    label="Pix"
                    hint="Aprovação em 1 segundo"
                  />
                  <PaymentOption
                    active={pagamento === "cartao"}
                    onClick={() => setPagamento("cartao")}
                    icon={CreditCard}
                    label="Cartão"
                    hint="Parcele em até 3x sem juros"
                  />
                  <PaymentOption
                    active={pagamento === "boleto"}
                    onClick={() => setPagamento("boleto")}
                    icon={Landmark}
                    label="Boleto"
                    hint="Compensação em 2 dias úteis"
                  />
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
              <dl className="space-y-2 rounded-xl bg-muted/50 p-3 text-xs">
                <DefItem label="Especialidade" value={especialidade} />
                <DefItem
                  label="Profissional"
                  value={profSelecionado?.nome ?? null}
                />
                <DefItem
                  label="Data"
                  value={data ? formatDateLong(data) : null}
                />
                <DefItem label="Horário" value={horario} mono />
                {step === "pagamento" && (
                  <DefItem
                    label="Pagamento"
                    value={
                      pagamento === "pix"
                        ? "Pix"
                        : pagamento === "cartao"
                          ? "Cartão"
                          : "Boleto"
                    }
                  />
                )}
              </dl>
              {valorBase > 0 && (
                <div className="flex items-center justify-between border-t border-border pt-3 text-base font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">{formatBRL(valorBase)}</span>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                {stepIndex > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prev}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                )}
                {step !== "pagamento" ? (
                  <Button
                    type="submit"
                    disabled={!canAdvance()}
                    className="flex-1"
                  >
                    Continuar
                  </Button>
                ) : (
                  <Button type="submit" className="flex-1">
                    Confirmar e pagar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}

function DefItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <dt className="text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "text-right font-medium",
          mono && "tabular-nums",
          !value && "italic text-muted-foreground",
        )}
      >
        {value ?? "— selecione —"}
      </dd>
    </div>
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
        "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted",
      )}
    >
      <Icon
        size={20}
        className={active ? "text-primary" : "text-muted-foreground"}
      />
      <p className="text-sm font-semibold">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </button>
  );
}
