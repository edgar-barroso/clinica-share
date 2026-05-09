"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import { apiGetStaff, apiUpdateStaff, type CargoStaff } from "@/lib/api/staff";
import { apiErrorMessage } from "@/lib/api-client";

const CARGO_LABEL: Record<CargoStaff, string> = {
  atendente: "Atendente",
  auxiliar: "Auxiliar Financeiro",
};

export default function EditarMembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cargo, setCargo] = useState<CargoStaff>("atendente");
  const [ativo, setAtivo] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    apiGetStaff(id)
      .then((res) => {
        setNome(res.staff.nome);
        setEmail(res.staff.email);
        setTelefone(res.staff.telefone);
        setCargo(res.staff.cargo);
        setAtivo(res.staff.ativo);
      })
      .catch((err) => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else toast.error(apiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiUpdateStaff(id, { nome, email, telefone, cargo, ativo });
      toast.success("Alterações salvas");
      router.push(`/equipe/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <aside className="lg:col-span-1">
            <Skeleton className="h-44 rounded-2xl" />
          </aside>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Membro não encontrado.</p>
        <Link
          href="/equipe"
          className={`${buttonVariants({ variant: "outline" })} mt-4 inline-flex`}
        >
          <ArrowLeft size={14} />
          Voltar para equipe
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Link
        href={`/equipe/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <PageHeader
        title={`Editar ${nome}`}
        description="Atualize cargo, dados de contato ou status de acesso"
        actions={
          <Link
            href={`/equipe/${id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Cargo</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCargo("atendente")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  cargo === "atendente"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <p className="text-sm font-semibold">Atendente</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Recebe pacientes, agenda consultas e registra chegada
                </p>
              </button>
              <button
                type="button"
                onClick={() => setCargo("auxiliar")}
                className={`rounded-xl border p-4 text-left transition-colors ${
                  cargo === "auxiliar"
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <p className="text-sm font-semibold">Auxiliar Financeiro</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Confere repasses, registra pagamentos e audita atendimentos
                </p>
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select
                  id="status"
                  value={ativo ? "ativo" : "inativo"}
                  onChange={(e) => setAtivo(e.target.value === "ativo")}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Inativo bloqueia o login sem apagar histórico.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-xs">
                <p>
                  <span className="text-muted-foreground">Cargo:</span>{" "}
                  <span className="font-medium">{CARGO_LABEL[cargo]}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span>{" "}
                  <span className="font-medium">{ativo ? "Ativo" : "Inativo"}</span>
                </p>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
