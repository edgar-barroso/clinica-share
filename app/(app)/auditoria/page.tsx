import { ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
import { auditoria } from "@/lib/mock/data";
import { formatDateTime } from "@/lib/format";

export default function AuditoriaPage() {
  const ordenado = [...auditoria].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Toda alteração financeira é registrada automaticamente (RNF-102)"
      />

      <Card className="mb-6 border-info/30 bg-info/5">
        <CardContent className="flex items-start gap-3 p-5">
          <div className="mt-0.5 rounded-xl bg-info/10 p-2 text-info">
            <ShieldCheck size={18} />
          </div>
          <div className="text-sm">
            <p className="font-semibold">Rastreabilidade total</p>
            <p className="mt-1 text-muted-foreground">
              Cada registro desta tela cumpre a regra inegociável <code className="rounded bg-muted px-1 py-0.5 text-xs">user_id, timestamp, entidade, campo, valor antes, valor depois, motivo</code>.
              Dados clínicos de pacientes não são registrados (RNF-105).
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Quem</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead>De → Para</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ordenado.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                    {formatDateTime(l.timestamp)}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{l.userNome}</p>
                    <p className="text-xs text-muted-foreground capitalize">{l.userId}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.entidade}</Badge>
                    <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                      #{l.entidadeId}
                    </p>
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{l.campo}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm tabular-nums">
                      <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                        {l.valorAntes}
                      </span>
                      <span className="text-muted-foreground">→</span>
                      <span className="rounded bg-success/10 px-1.5 py-0.5 text-xs text-success">
                        {l.valorDepois}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{l.motivo}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
