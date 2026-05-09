"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Search, UserPlus, Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layouts/page-header";
import { NovoPacienteDialog } from "@/components/paciente/novo-paciente-dialog";
import { apiListPacientes, type Paciente } from "@/lib/api/pacientes";
import { apiErrorMessage } from "@/lib/api-client";
import { formatDate } from "@/lib/format";
import { useCurrentUser } from "@/lib/current-user";
import { usePagination } from "@/lib/use-pagination";

function initials(name: string) {
  const parts = name
    .split(" ")
    .filter((p) => !["Dr.", "Dra.", "Sr.", "Sra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function PacientesPage() {
  const { role } = useCurrentUser();
  const podeCriar = role === "admin" || role === "atendente";

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const { pacientes } = await apiListPacientes(
        q ? { q } : undefined,
      );
      setPacientes(pacientes);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Debounce na busca server-side
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchData(busca.trim() || undefined);
    }, 300);
    return () => clearTimeout(t);
  }, [busca, fetchData]);

  const { page, totalPages, setPage, slice } = usePagination(pacientes.length);
  const visiveis = slice(pacientes);

  // Reseta para página 1 ao buscar
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca]);

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Cadastros completos com contato, plano e dados de identidade"
        actions={
          podeCriar && (
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className={buttonVariants()}
            >
              <UserPlus size={16} />
              Cadastrar paciente
            </button>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              type="search"
              placeholder="Buscar por nome, e-mail, CPF ou telefone…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
              aria-label="Buscar pacientes"
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : pacientes.length === 0 ? (
        <EmptyState
          icon={Users}
          title={
            busca
              ? "Nenhum paciente encontrado"
              : "Nenhum paciente cadastrado"
          }
          description={
            busca
              ? "Tente outro termo de busca ou cadastre um novo paciente."
              : "Comece cadastrando o primeiro paciente da clínica."
          }
          action={
            podeCriar ? (
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                className={buttonVariants()}
              >
                <UserPlus size={16} />
                Cadastrar paciente
              </button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        <Avatar className="size-9 bg-primary/10 text-primary">
                          <AvatarFallback>{initials(p.nome)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {p.nome}
                          </p>
                          {p.dataNascimento && (
                            <p className="text-xs text-muted-foreground">
                              Nascido em {formatDate(p.dataNascimento, "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail size={12} /> {p.email}
                      </p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
                        <Phone size={12} /> {p.telefone}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      {p.cpf ?? "—"}
                    </TableCell>
                    <TableCell>
                      {p.plano?.temPlano ? (
                        <Badge variant="outline">
                          {p.plano.operadora ?? "Plano"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Particular
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {formatDate(p.createdAt, "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </CardContent>
        </Card>
      )}

      <NovoPacienteDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={() => {
          setDialogOpen(false);
          void fetchData(busca.trim() || undefined);
        }}
      />
    </>
  );
}
