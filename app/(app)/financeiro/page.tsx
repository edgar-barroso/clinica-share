import Link from "next/link";
import { ArrowRight, Calculator, FileBarChart, Receipt, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layouts/page-header";
import { repasses } from "@/lib/mock/data";
import { formatBRL } from "@/lib/format";

const cards: Array<{
  href: string;
  title: string;
  description: string;
  icon: typeof Wallet;
  disabled?: boolean;
}> = [
  {
    href: "/financeiro/repasses",
    title: "Repasses",
    description: "Calculados automaticamente por atendimentos realizados e contratos",
    icon: Wallet,
  },
  {
    href: "/financeiro/fechamento",
    title: "Fechamento semanal",
    description: "Prestação de contas semanal, exportável em PDF",
    icon: Calculator,
  },
  {
    href: "/relatorios",
    title: "Relatórios",
    description: "Filtros por profissional, consultório e período (RE02/RE03)",
    icon: FileBarChart,
  },
  {
    href: "/relatorios/gratuitas-descontos",
    title: "Descontos e gratuidades",
    description: "Listagem de consultas gratuitas com justificativa (RE04)",
    icon: Receipt,
  },
];

export default function FinanceiroPage() {
  const abertos = repasses.filter((r) => r.status === "aberto");
  const totalAbertos = abertos.reduce((s, r) => s + r.valorRepasse, 0);

  return (
    <>
      <PageHeader
        title="Financeiro"
        description="Centro de controle: repasses, fechamento e relatórios financeiros"
      />

      {abertos.length > 0 && (
        <Card className="mb-6 border-warning/50 bg-warning/5">
          <CardContent className="flex flex-col items-start justify-between gap-3 p-5 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold">
                {abertos.length} repasses aguardando pagamento
              </p>
              <p className="text-xs text-muted-foreground">
                Total em aberto: {formatBRL(totalAbertos)} · Período 06 a 12 de abril
              </p>
            </div>
            <Link
              href="/financeiro/fechamento"
              className="text-sm font-medium text-primary hover:underline"
            >
              Abrir fechamento semanal →
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.disabled ? "#" : c.href}
            className={c.disabled ? "pointer-events-none" : ""}
          >
            <Card
              className={`h-full transition-colors hover:border-primary/30 ${c.disabled ? "opacity-60" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <c.icon size={20} />
                  </div>
                  {c.disabled ? (
                    <Badge variant="secondary">Em breve</Badge>
                  ) : (
                    <ArrowRight size={18} className="text-muted-foreground" />
                  )}
                </div>
                <CardTitle className="mt-2">{c.title}</CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </>
  );
}
