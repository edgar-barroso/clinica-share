"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Mail, Pencil, Phone, User as UserIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetMeuPerfil,
} from "@/lib/api/portal-paciente";
import type { Paciente } from "@/lib/api/pacientes";
import { apiErrorMessage } from "@/lib/api-client";

export default function PerfilPage() {
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { paciente } = await apiGetMeuPerfil();
      setPaciente(paciente);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  if (loading || !paciente) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando…
      </p>
    );
  }

  return (
    <>
      <PageHeader
        title="Meu perfil"
        description="Seus dados de contato e cadastro"
        actions={
          <Link
            href="/p/perfil/editar"
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil size={14} />
            Editar
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row icon={UserIcon} label="Nome" value={paciente.nome} />
            <Row icon={Phone} label="Telefone" value={paciente.telefone} />
            <Row icon={Mail} label="E-mail" value={paciente.email} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados pessoais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="CPF" value={paciente.cpf ?? "—"} />
            <Row
              label="Data de nascimento"
              value={paciente.dataNascimento ?? "—"}
            />
            <Row
              label="Sexo"
              value={
                paciente.sexo === "F"
                  ? "Feminino"
                  : paciente.sexo === "M"
                    ? "Masculino"
                    : paciente.sexo === "outro"
                      ? "Outro"
                      : "—"
              }
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof UserIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {Icon && (
        <div className="mt-0.5 rounded-lg bg-muted p-2 text-muted-foreground">
          <Icon size={14} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
