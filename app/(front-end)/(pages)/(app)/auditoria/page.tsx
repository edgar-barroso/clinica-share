"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
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
import { usePagination } from "@/lib/use-pagination";

/**
 * Mapeia o tipo da entidade auditada → rota de visualização. Retorna `null`
 * quando a entidade não tem tela de detalhe (ex: Configuracao).
 */
function entidadeHref(entidade: string, id: string): string | null {
  switch (entidade) {
    case "Atendimento":
      return `/atendimentos/${id}`;
    case "Repasse":
      return `/financeiro/repasses/${id}`;
    case "Profissional":
      return `/profissionais/${id}`;
    default:
      return null;
  }
}

export default function AuditoriaPage() {
  const router = useRouter();
  const [entidade, setEntidade] = useState("");
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { logs } = await apiListAuditoria({
        entidade: entidade || undefined,
      });
      setLogs(logs);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [entidade]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const { page, totalPages, setPage, slice } = usePagination(logs.length);
  const visiveis = slice(logs);

  // Reseta para página 1 ao trocar de entidade — evita ficar "preso"
  // numa página que não existe mais após o filtro.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entidade]);

  return (
    <>
      <PageHeader
        title="Auditoria"
        description="Trilha de alterações financeiras"
      />

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="space-y-1.5 sm:max-w-xs">
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
                {visiveis.map((l) => {
                  const href = entidadeHref(l.entidade, l.entidadeId);
                  const onActivate = () => {
                    if (href) router.push(href);
                  };
                  return (
                    <TableRow
                      key={l.id}
                      role={href ? "link" : undefined}
                      tabIndex={href ? 0 : undefined}
                      aria-label={
                        href
                          ? `Abrir ${l.entidade.toLowerCase()} afetado`
                          : undefined
                      }
                      onClick={href ? onActivate : undefined}
                      onKeyDown={
                        href
                          ? (e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                onActivate();
                              }
                            }
                          : undefined
                      }
                      className={
                        href
                          ? "cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          : undefined
                      }
                    >
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
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline">{l.entidade}</Badge>
                          {href && (
                            <ExternalLink
                              size={12}
                              className="text-muted-foreground"
                              aria-hidden="true"
                            />
                          )}
                        </div>
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
                  );
                })}
              </TableBody>
            </Table>
          )}
          {logs.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>
    </>
  );
}
