"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import type { CargoStaff } from "@/lib/mock/types";

const CARGO_LABEL: Record<CargoStaff, string> = {
  atendente: "Atendente",
  auxiliar: "Auxiliar Financeiro",
};

export default function NovoMembroPage() {
  return (
    <Suspense fallback={null}>
      <NovoMembroPageInner />
    </Suspense>
  );
}

function NovoMembroPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cargoInicial =
    (searchParams.get("cargo") as CargoStaff | null) ?? "atendente";
  const [cargo, setCargo] = useState<CargoStaff>(
    cargoInicial === "auxiliar" ? "auxiliar" : "atendente",
  );

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success(`${CARGO_LABEL[cargo]} cadastrado`, {
      description: "Acesso liberado (protótipo, não persistido).",
    });
    setTimeout(() => router.push("/equipe"), 600);
  }

  return (
    <>
      <PageHeader
        title="Novo membro da equipe"
        description="Cadastre um atendente ou auxiliar financeiro com acesso ao sistema"
        actions={
          <Link
            href="/equipe"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        }
      />

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
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
                <Input id="nome" placeholder="Joana Ribeiro" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@clinicashare.com.br"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(11) 90000-0000"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  autoComplete="new-password"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select id="status" defaultValue="ativo">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
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
              <div className="rounded-xl bg-muted/50 p-3 text-xs">
                <p>
                  <span className="text-muted-foreground">Cargo:</span>{" "}
                  <span className="font-medium">{CARGO_LABEL[cargo]}</span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Após cadastro, o membro poderá entrar em <strong>/login</strong>{" "}
                escolhendo o perfil correspondente.
              </p>
              <Button type="submit" className="w-full" size="lg">
                Cadastrar membro
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
