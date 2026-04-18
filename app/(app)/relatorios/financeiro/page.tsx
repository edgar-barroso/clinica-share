import Link from "next/link";
import { ArrowLeft, Download, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaymentStatusBadge } from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  atendimentos,
  consultorios,
  getConsultorio,
  getPaciente,
  getProfissional,
  profissionais,
} from "@/lib/mock/data";
import { formatBRL, formatDate } from "@/lib/format";

export default function RelatorioFinanceiroPage() {
  const dataset = atendimentos
    .filter((a) => a.status === "realizado")
    .sort((a, b) => `${b.data}T${b.hora}`.localeCompare(`${a.data}T${a.hora}`));
  const totalBruto = dataset.reduce(
    (s, a) => s + a.valorConsulta + a.procedimentos.reduce((ss, p) => ss + p.valor, 0),
    0,
  );
  const totalPagos = dataset
    .filter((a) => a.statusPagamento === "pago")
    .reduce(
      (s, a) => s + a.valorConsulta + a.procedimentos.reduce((ss, p) => ss + p.valor, 0),
      0,
    );

  return (
    <>
      <Link
        href="/relatorios"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Todos os relatórios
      </Link>

      <PageHeader
        title="Relatório financeiro (RE02)"
        description="Atendimentos realizados com filtros por profissional, consultório e período"
        actions={
          <Button variant="outline">
            <Download size={16} />
            Exportar CSV
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Filter size={14} />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="inicio">Início</Label>
            <Input id="inicio" type="date" defaultValue="2026-04-06" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fim">Fim</Label>
            <Input id="fim" type="date" defaultValue="2026-04-12" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prof">Profissional</Label>
            <Select id="prof" defaultValue="todos">
              <option value="todos">Todos</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cons">Consultório</Label>
            <Select id="cons" defaultValue="todos">
              <option value="todos">Todos</option>
              {consultorios.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Atendimentos realizados</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{dataset.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Receita bruta</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{formatBRL(totalBruto)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Receita recebida</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-success">
            {formatBRL(totalPagos)}
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Profissional</TableHead>
                <TableHead>Consultório</TableHead>
                <TableHead>Paciente</TableHead>
                <TableHead className="text-right">Bruto</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.map((a) => {
                const bruto =
                  a.valorConsulta + a.procedimentos.reduce((s, p) => s + p.valor, 0);
                return (
                  <TableRow key={a.id}>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">
                      {formatDate(a.data, "dd/MM")} {a.hora}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getProfissional(a.profissionalId)?.nome}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getConsultorio(a.consultorioId)?.nome}
                    </TableCell>
                    <TableCell className="text-sm">
                      {getPaciente(a.pacienteId)?.nome}
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
        </CardContent>
      </Card>
    </>
  );
}
