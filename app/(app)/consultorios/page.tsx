import Link from "next/link";
import { DoorOpen, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layouts/page-header";
import { consultorios, receitaPorConsultorio } from "@/lib/mock/data";
import { formatBRL } from "@/lib/format";

export default function ConsultoriosPage() {
  const ranking = receitaPorConsultorio();
  const mapReceita = new Map(ranking.map((r) => [r.consultorioId, r]));

  return (
    <>
      <PageHeader
        title="Consultórios"
        description="12 salas cadastradas · desempenho da semana 06-12 de abril"
        actions={
          <Link href="/consultorios/novo" className={buttonVariants()}>
            <Plus size={16} />
            Novo consultório
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {consultorios.map((c) => {
          const r = mapReceita.get(c.id);
          const receita = r?.receita ?? 0;
          const atends = r?.atendimentos ?? 0;
          const ocioso = atends === 0;
          return (
            <Card key={c.id} className="transition-colors hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <DoorOpen size={16} />
                      </div>
                      {c.nome}
                    </CardTitle>
                    <CardDescription className="mt-1">{c.tipo}</CardDescription>
                  </div>
                  {ocioso ? (
                    <Badge variant="secondary">Ocioso</Badge>
                  ) : (
                    <Badge variant="success">Ativo</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Especialidades compatíveis</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {c.especialidadesCompativeis.slice(0, 3).map((esp) => (
                      <Badge key={esp} variant="outline">
                        {esp}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-end justify-between border-t border-border pt-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Receita da semana</p>
                    <p className="text-lg font-semibold tabular-nums">{formatBRL(receita)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Atendimentos</p>
                    <p className="text-lg font-semibold tabular-nums">{atends}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
