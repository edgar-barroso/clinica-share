"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Calendar, CheckCircle2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import { consultorios, pacientes, profissionais } from "@/lib/mock/data";

const HORARIOS_MANHA = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30"];
const HORARIOS_TARDE = ["13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

export default function NovoAgendamentoPage() {
  const router = useRouter();
  const [horario, setHorario] = useState<string | null>(null);
  const [ocupados] = useState(new Set(["09:30", "14:00", "14:30", "15:30"]));

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!horario) {
      toast.warning("Escolha um horário disponível");
      return;
    }
    toast.success("Agendamento criado", {
      description: "Um SMS/WhatsApp de confirmação seria enviado ao paciente.",
    });
    setTimeout(() => router.push("/agenda"), 600);
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
                <Select id="paciente" required defaultValue="pt01">
                  {pacientes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.telefone}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <Input id="data" type="date" defaultValue="2026-04-14" required />
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
                  <span className="font-medium">14/04/2026</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Horário:</span>{" "}
                  <span className="font-medium">
                    {horario ?? <span className="text-warning">— selecione —</span>}
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Após confirmar, o sistema bloqueia automaticamente o horário (AG05) e envia
                lembretes via WhatsApp IA (AG07, configurável).
              </p>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={!horario}>
            <CheckCircle2 size={16} />
            Confirmar agendamento
          </Button>
        </aside>
      </form>
    </>
  );
}
