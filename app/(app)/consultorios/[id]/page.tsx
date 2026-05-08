import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, TrendingUp } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layouts/page-header";
import { ConsultorioMetrics } from "@/components/consultorios/consultorio-metrics";
import {
  atendimentos,
  getConsultorio,
  getPaciente,
  getProfissional,
} from "@/lib/mock/data";
import { formatBRL, formatDate } from "@/lib/format";
import { PaymentStatusBadge } from "@/components/financial/status-badge";

export default async function ConsultorioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = getConsultorio(id);
  if (!c) notFound();

  const atsDaSala = atendimentos
    .filter((a) => a.consultorioId === c.id && a.status !== "cancelado")
    .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`));

  return (
    <>
      <Link
        href="/consultorios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para consultórios
      </Link>

      <PageHeader
        title={c.nome}
        description={`${c.tipo} · ${c.especialidadesCompativeis.join(", ")}`}
        actions={
          <Link
            href={`/consultorios/${c.id}/editar`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil size={16} />
            Editar consultório
          </Link>
        }
      />

      <ConsultorioMetrics consultorioId={c.id} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos recentes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {atsDaSala.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">
                  Nenhum atendimento realizado nesta sala ainda.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead>Pagamento</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atsDaSala.slice(0, 8).map((a) => {
                      const paciente = getPaciente(a.pacienteId);
                      const prof = getProfissional(a.profissionalId);
                      const bruto =
                        a.valorConsulta;
                      return (
                        <TableRow key={a.id}>
                          <TableCell className="text-sm tabular-nums">
                            {formatDate(a.data, "dd/MM")} {a.hora}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {paciente?.nome}
                          </TableCell>
                          <TableCell className="text-sm">
                            {prof?.nome}
                            <p className="text-xs text-muted-foreground">
                              {prof?.especialidade}
                            </p>
                          </TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {formatBRL(bruto)}
                          </TableCell>
                          <TableCell>
                            <PaymentStatusBadge status={a.statusPagamento} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Equipamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {c.equipamentos.map((eq) => (
                  <Badge key={eq} variant="outline">
                    {eq}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especialidades compatíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {c.especialidadesCompativeis.map((esp) => (
                  <div
                    key={esp}
                    className="flex items-center justify-between rounded-xl bg-muted/50 px-3 py-2 text-sm"
                  >
                    <span>{esp}</span>
                    <TrendingUp size={14} className="text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
