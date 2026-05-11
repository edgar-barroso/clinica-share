"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, DoorOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layouts/page-header";
import { apiListConsultorios, type Consultorio } from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";
import { usePagination } from "@/lib/use-pagination";

export default function ConsultoriosPage() {
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListConsultorios()
      .then((res) => setConsultorios(res.consultorios))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const { page, totalPages, setPage, slice } = usePagination(consultorios.length);
  const visiveis = slice(consultorios);

  return (
    <>
      <PageHeader
        title="Consultórios"
        description={
          loading
            ? "Salas da clínica disponíveis para agendamento"
            : `${consultorios.length} sala${consultorios.length === 1 ? "" : "s"} cadastrada${consultorios.length === 1 ? "" : "s"}`
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className={buttonVariants({ variant: "outline" })}
            >
              <BarChart3 size={16} />
              Dashboard de ocupação
            </Link>
            <Link href="/consultorios/novo" className={buttonVariants()}>
              <Plus size={16} />
              Novo consultório
            </Link>
          </div>
        }
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : consultorios.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title="Nenhum consultório cadastrado"
          description="Comece adicionando o primeiro consultório da clínica."
          action={
            <Link href="/consultorios/novo" className={buttonVariants()}>
              <Plus size={16} />
              Novo consultório
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiveis.map((c) => (
            <Link key={c.id} href={`/consultorios/${c.id}`} className="block">
              <Card className="h-full transition-colors hover:border-primary/30">
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
                    {c.ativo ? (
                      <Badge variant="success">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
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
                      {c.especialidadesCompativeis.length === 0 && (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Equipamentos</p>
                    <p className="text-sm">
                      {c.equipamentos.length > 0 ? c.equipamentos.join(", ") : "—"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </>
  );
}
