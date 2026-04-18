import Link from "next/link";
import { ArrowRight, Clock, MessageSquare, Settings2, ShieldAlert } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layouts/page-header";

const sections: Array<{
  href: string;
  icon: typeof Clock;
  title: string;
  description: string;
  badge?: string;
}> = [
  {
    href: "/configuracoes/turnos",
    icon: Clock,
    title: "Turnos da clínica",
    description:
      "Define os blocos fixos de horário (manhã, tarde, noite) usados para agenda e cálculo de aluguel (AG03)",
    badge: "PEND-014",
  },
  {
    href: "/configuracoes/integracoes",
    icon: MessageSquare,
    title: "Integrações externas",
    description:
      "WhatsApp IA para lembretes automáticos, e futuras integrações (AG07)",
    badge: "PEND-022",
  },
];

export default function ConfiguracoesPage() {
  return (
    <>
      <PageHeader
        title="Configurações"
        description="Ajustes estruturais da clínica. Algumas decisões dependem da R2."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="mt-2 flex items-center gap-2">
                  <CardTitle>{s.title}</CardTitle>
                  {s.badge && <Badge variant="warning">{s.badge}</Badge>}
                </div>
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
            Decisões protegidas por regras inegociáveis
          </CardTitle>
          <CardDescription>
            Dados clínicos de paciente (RNF-105), audit log financeiro (RNF-102) e
            cálculo de repasse apenas no servidor (RNF-103) não são configuráveis —
            estão codificados na plataforma. Alterações exigem revisão técnica e nova
            decisão em <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              estado-decisoes-tomadas.md
            </code>
            .
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Settings2 size={16} />
          <span>Mais configurações virão conforme novos requisitos forem confirmados.</span>
        </div>
      </div>
    </>
  );
}
