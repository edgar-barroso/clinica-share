import Link from "next/link";
import {
  ArrowRight,
  Ban,
  DoorOpen,
  FileBarChart,
  Gift,
  Wallet,
} from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";

const reports = [
  {
    href: "/relatorios/financeiro",
    icon: Wallet,
    title: "Financeiro por profissional e período (RE02)",
    description:
      "Receita bruta e repasse calculado, com filtros por profissional, consultório e período",
  },
  {
    href: "/relatorios/consultorios",
    icon: DoorOpen,
    title: "Ranking de consultórios por receita (RE03)",
    description:
      "Qual sala gera mais receita no período? Insumo estratégico para decisões de contrato",
  },
  {
    href: "/relatorios/gratuitas-descontos",
    icon: Gift,
    title: "Consultas gratuitas e descontos (RE04)",
    description:
      "Listagem das gratuidades concedidas no período, com justificativa obrigatória (FI06)",
  },
  {
    href: "/relatorios/cancelamentos",
    icon: Ban,
    title: "Cancelamentos com motivo (RE05)",
    description:
      "Todos os cancelamentos registrados com o motivo informado pelo paciente ou atendente",
  },
];

export default function RelatoriosPage() {
  return (
    <>
      <PageHeader
        title="Relatórios"
        description="Quatro relatórios gerenciais derivados dos atendimentos, pagamentos e cancelamentos"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {reports.map((r) => (
          <Link key={r.href} href={r.href} className="block">
            <Card className="h-full transition-colors hover:border-primary/30">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <r.icon size={20} />
                  </div>
                  <ArrowRight size={18} className="text-muted-foreground" />
                </div>
                <CardTitle className="mt-2 text-base leading-tight">{r.title}</CardTitle>
                <CardDescription>{r.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="mt-6 border-info/30 bg-info/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileBarChart size={16} className="text-info" />
            Como usar os relatórios
          </CardTitle>
          <CardDescription>
            Os quatro relatórios respondem perguntas diferentes. Para prestação de contas
            ao Dr. Edson, use o <strong>Financeiro</strong>. Para avaliar se um consultório
            precisa mudar de modalidade (aluguel ↔ percentual), use o{" "}
            <strong>Ranking</strong>. Para detectar padrões de gratuidade ou
            cancelamento, use os dois últimos.
          </CardDescription>
        </CardHeader>
      </Card>
    </>
  );
}
