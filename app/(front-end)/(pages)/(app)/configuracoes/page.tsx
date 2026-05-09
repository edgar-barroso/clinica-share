import Link from "next/link";
import { ArrowRight, Clock, Settings2, ShieldAlert } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";

const sections: Array<{
  href: string;
  icon: typeof Clock;
  title: string;
  description: string;
}> = [
  {
    href: "/configuracoes/turnos",
    icon: Clock,
    title: "Turnos da clínica",
    description:
      "Define os blocos fixos de horário (manhã, tarde, noite) usados para agenda e cálculo de aluguel",
  },
];

export default function ConfiguracoesPage() {
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Ajustes estruturais da clínica."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:max-w-md">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="block">
            <Card className="h-full transition-colors hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon size={20} />
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground" />
                </div>
                <CardTitle className="mt-2">{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-info/30 bg-info/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <ShieldAlert size={16} className="text-info" />
            Regras protegidas por design
          </CardTitle>
          <CardDescription>
            Privacidade dos dados clínicos do paciente, registro de auditoria
            das alterações financeiras e cálculo de repasse no servidor não são
            configuráveis — estão codificados na plataforma para evitar
            alteração acidental.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Settings2 size={16} />
          <span>Mais configurações virão conforme a clínica evoluir.</span>
        </div>
      </div>
    </>
  );
}
