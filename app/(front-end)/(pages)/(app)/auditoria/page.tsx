"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiListAuditoria,
  type AuditLogItem,
} from "@/lib/api/auditoria";
import { apiErrorMessage } from "@/lib/api-client";

export default function AuditoriaPage() {
  const [entidade, setEntidade] = useState("");
  const [campo, setCampo] = useState("");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { logs } = await apiListAuditoria({
        entidade: entidade || undefined,
        campo: campo || undefined,
      });
      setLogs(logs);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [entidade, campo]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Trilha de alterações financeiras (RNF-102 / RF-025)"
      />

      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="entidade">Entidade</Label>
            <Select
              id="entidade"
              value={entidade}
              onChange={(e) => setEntidade(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="Atendimento">Atendimento</option>
              <option value="Repasse">Repasse</option>
              <option value="Profissional">Profissional</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="campo">Campo</Label>
            <Input
              id="campo"
              value={campo}
              onChange={(e) => setCampo(e.target.value)}
              placeholder="Ex: status, valorConsulta"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{logs.length} registros</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando…
            </p>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="Nenhum registro de auditoria"
              description="Mutações financeiras serão registradas aqui."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Quando</TableHead>
                  <TableHead>Quem</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Antes → Depois</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm">
                        {new Date(l.timestamp).toLocaleDateString("pt-BR")}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {new Date(l.timestamp).toLocaleTimeString("pt-BR")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{l.userNome}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{l.entidade}</Badge>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {l.entidadeId.slice(0, 8)}…
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{l.campo}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-muted-foreground">
                        {l.valorAntes || "—"}
                      </span>
                      {" → "}
                      <span className="text-sm font-medium">
                        {l.valorDepois}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md text-sm">
                      {l.motivo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
