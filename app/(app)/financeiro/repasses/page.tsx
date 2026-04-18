import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RepasseStatusBadge } from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import { getProfissional, repasses } from "@/lib/mock/data";
import { formatBRL, formatDate, formatPercent } from "@/lib/format";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function RepassesPage() {
  const abertos = repasses.filter((r) => r.status === "aberto");
  const pagos = repasses.filter((r) => r.status === "pago");
  const totalAbertos = abertos.reduce((s, r) => s + r.valorRepasse, 0);
  const totalPagos = pagos.reduce((s, r) => s + r.valorRepasse, 0);

  return (
    <>
      <PageHeader
        title="Repasses"
        description="Valores calculados automaticamente para o período 06 a 12 de abril"
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Em aberto</p>
          <p className="mt-1 text-2xl font-bold text-warning tabular-nums">
            {formatBRL(totalAbertos)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {abertos.length} repasses pendentes de pagamento
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Pagos no período</p>
          <p className="mt-1 text-2xl font-bold text-success tabular-nums">
            {formatBRL(totalPagos)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {pagos.length} repasses já quitados
          </p>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profissional</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Período</TableHead>
                <TableHead className="text-right">Atendimentos</TableHead>
                <TableHead className="text-right">Receita bruta</TableHead>
                <TableHead className="text-right">Repasse devido</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repasses.map((r) => {
                const prof = getProfissional(r.profissionalId)!;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <Link href={`/financeiro/repasses/${r.id}`} className="block hover:text-primary">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 bg-primary/10 text-primary">
                          <AvatarFallback>{initials(prof.nome)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{prof.nome}</p>
                          <p className="text-xs text-muted-foreground">{prof.especialidade}</p>
                        </div>
                      </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">
                        {prof.modalidadeContrato === "percentual"
                          ? `Percentual ${formatPercent(prof.percentualRepasse ?? 0)}`
                          : `Aluguel fixo`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {prof.modalidadeContrato === "aluguel-fixo"
                          ? `${formatBRL(prof.valorAluguelPorTurno ?? 0)}/turno`
                          : "sobre receita bruta"}
                      </p>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(r.periodoInicio, "dd/MM")} – {formatDate(r.periodoFim, "dd/MM")}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {r.atendimentosIds.length}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBRL(r.receitaBruta)}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(r.valorRepasse)}
                    </TableCell>
                    <TableCell>
                      <RepasseStatusBadge status={r.status} />
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
