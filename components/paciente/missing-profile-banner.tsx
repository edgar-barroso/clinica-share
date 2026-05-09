"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { apiGetMeuPerfil } from "@/lib/api/portal-paciente";
import { useCurrentUser } from "@/lib/current-user";
import { cn } from "@/lib/utils";
import type { Paciente } from "@/lib/api/pacientes";

function listarPendencias(p: Paciente): string[] {
  const out: string[] = [];
  if (!p.cpf) out.push("CPF");
  if (!p.dataNascimento) out.push("Data de nascimento");
  if (!p.sexo) out.push("Sexo");
  if (!p.email) out.push("E-mail");
  if (!p.telefone) out.push("Telefone");
  if (!p.endereco) out.push("Endereço");
  return out;
}

/**
 * Banner global do portal do paciente avisando quando há campos
 * obrigatórios faltando no cadastro. Refaz o fetch a cada navegação
 * dentro de /p/* para refletir alterações feitas em /p/perfil/editar.
 * Some na própria tela de edição para não competir com o formulário.
 */
export function MissingProfileBanner() {
  const pathname = usePathname();
  const { pacienteId, loading: userLoading } = useCurrentUser();
  const [pendencias, setPendencias] = useState<string[] | null>(null);

  const naTelaDeEdicao = pathname?.startsWith("/p/perfil/editar");

  useEffect(() => {
    if (userLoading || !pacienteId || naTelaDeEdicao) return;
    let cancelado = false;
    apiGetMeuPerfil()
      .then(({ paciente }) => {
        if (!cancelado) setPendencias(listarPendencias(paciente));
      })
      .catch(() => {
        if (!cancelado) setPendencias(null);
      });
    return () => {
      cancelado = true;
    };
  }, [pacienteId, userLoading, pathname, naTelaDeEdicao]);

  if (!pendencias || pendencias.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex flex-col gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 sm:flex-row sm:items-start sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle
          size={18}
          className="mt-0.5 shrink-0 text-warning"
          aria-hidden="true"
        />
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Complete seu cadastro
          </p>
          <p className="text-xs text-muted-foreground">
            Falta
            {pendencias.length === 1 ? "" : "m"}{" "}
            <span className="font-medium text-foreground">
              {pendencias.length}
            </span>{" "}
            dado{pendencias.length === 1 ? "" : "s"}: {pendencias.join(", ")}.
            Manter o perfil atualizado agiliza atendimentos e contatos da
            clínica.
          </p>
        </div>
      </div>
      <Link
        href="/p/perfil/editar"
        className={cn(
          buttonVariants({ size: "sm" }),
          "shrink-0 self-start sm:self-center",
        )}
      >
        <Pencil size={14} />
        Completar agora
      </Link>
    </div>
  );
}
