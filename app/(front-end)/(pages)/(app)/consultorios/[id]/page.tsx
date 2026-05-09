"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetConsultorio,
  apiDeactivateConsultorio,
  type Consultorio,
} from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";

export default function ConsultorioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [c, setC] = useState<Consultorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiGetConsultorio(id)
      .then((res) => setC(res.consultorio))
      .catch((err) => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else toast.error(apiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function desativar() {
    if (!c) return;
    if (!confirm(`Desativar ${c.nome}?`)) return;
    try {
      await apiDeactivateConsultorio(c.id);
      toast.success("Consultório desativado");
      router.push("/consultorios");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <>
        <Skeleton className="mb-6 h-12 w-full max-w-md" />
        <Skeleton className="h-64 w-full" />
      </>
    );
  }

  if (notFound || !c) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Consultório não encontrado.</p>
        <Link
          href="/consultorios"
          className={`${buttonVariants({ variant: "outline" })} mt-4 inline-flex`}
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
      </Card>
    );
  }

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
        description={`${c.tipo} · ${c.especialidadesCompativeis.join(", ") || "—"}`}
        actions={
          <div className="flex gap-2">
            <Link
              href={`/consultorios/${c.id}/editar`}
              className={buttonVariants({ variant: "outline" })}
            >
              <Pencil size={16} />
              Editar
            </Link>
            {c.ativo && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={desativar}
              >
                <Trash2 size={16} />
                Desativar
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Atendimentos recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Histórico de atendimentos será exibido aqui após a Fase 4 (registro de
                atendimentos via API).
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              {c.ativo ? (
                <Badge variant="success">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {c.equipamentos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum equipamento cadastrado.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {c.equipamentos.map((eq) => (
                    <Badge key={eq} variant="outline">
                      {eq}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especialidades compatíveis</CardTitle>
            </CardHeader>
            <CardContent>
              {c.especialidadesCompativeis.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma cadastrada.</p>
              ) : (
                <div className="space-y-2">
                  {c.especialidadesCompativeis.map((esp) => (
                    <div
                      key={esp}
                      className="rounded-xl bg-muted/50 px-3 py-2 text-sm"
                    >
                      {esp}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}
