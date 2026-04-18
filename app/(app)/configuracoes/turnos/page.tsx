import Link from "next/link";
import { AlertTriangle, ArrowLeft, Clock, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layouts/page-header";

const turnos = [
  {
    id: "manha",
    label: "Manhã",
    inicio: "07:00",
    fim: "12:00",
    usos: 4,
  },
  {
    id: "tarde",
    label: "Tarde",
    inicio: "13:00",
    fim: "18:00",
    usos: 5,
  },
  {
    id: "noite",
    label: "Noite",
    inicio: "18:00",
    fim: "20:00",
    usos: 2,
  },
];

export default function TurnosPage() {
  return (
    <>
      <Link
        href="/configuracoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Configurações
      </Link>

      <PageHeader
        title="Turnos da clínica"
        description="Blocos fixos de horário utilizados na alocação de profissionais (AG03) e no cálculo de aluguel por turno (FI08)"
        actions={
          <Link
            href="/configuracoes/turnos/novo"
            className={buttonVariants({ variant: "outline" })}
          >
            Novo turno
          </Link>
        }
      />

      <Card className="mb-6 border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertTriangle size={18} className="mt-0.5 text-warning" />
          <div className="text-sm">
            <p className="font-semibold">Valores provisórios — PEND-014</p>
            <p className="mt-1 text-muted-foreground">
              Os horários exatos dos turnos ainda serão confirmados com o Dr. Edson
              na Reunião R2. A clínica funciona das 7h às 19h/20h (ata R1 §1.1), mas
              os blocos exatos não foram definidos.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {turnos.map((t) => (
          <Card key={t.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Clock size={20} />
                </div>
                <Badge variant="secondary">{t.usos} alocações</Badge>
              </div>
              <CardTitle className="mt-2 capitalize">{t.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-2xl font-bold tabular-nums">
                {t.inicio} – {t.fim}
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                <Pencil size={12} />
                Editar horário
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
