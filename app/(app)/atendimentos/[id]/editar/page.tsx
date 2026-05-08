"use client";

import { useRouter } from "next/navigation";
import { use, useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/layouts/page-header";
import {
  AtendimentoForm,
  type AtendimentoFormValues,
} from "@/components/atendimento/atendimento-form";
import { atendimentos } from "@/lib/mock/data";
import { useCurrentUser } from "@/lib/current-user";

export default function EditarAtendimentoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { role, profissionalId } = useCurrentUser();

  const atendimento = useMemo(
    () => atendimentos.find((a) => a.id === id),
    [id],
  );

  if (!atendimento) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Atendimento #{id} não encontrado.
        </p>
        <Link
          href="/atendimentos"
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para atendimentos
        </Link>
      </div>
    );
  }

  if (role === "paciente" || role === "atendente") {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-muted-foreground">
          Seu papel atual não tem permissão para editar atendimentos.
        </p>
        <Link
          href={`/atendimentos/${id}`}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para o atendimento
        </Link>
      </div>
    );
  }

  const isProfissional = role === "profissional";

  if (isProfissional && profissionalId !== atendimento.profissionalId) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium">
          Você só pode editar suas próprias consultas.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Esta consulta foi atendida por outro profissional.
        </p>
        <Link
          href={`/atendimentos/${id}`}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para o atendimento
        </Link>
      </div>
    );
  }

  const initial: Partial<AtendimentoFormValues> = {
    data: atendimento.data,
    hora: atendimento.hora,
    pacienteId: atendimento.pacienteId,
    profissionalId: atendimento.profissionalId,
    consultorioId: atendimento.consultorioId,
    valorConsulta: atendimento.valorConsulta,
    usaProntuarioExterno: atendimento.usaProntuarioExterno,
    prontuario: atendimento.prontuarioInterno,
    procedimentos: atendimento.procedimentos.map((p) => ({
      nome: p.nome,
      valor: p.valor,
    })),
    statusPagamento: atendimento.statusPagamento,
    motivo: atendimento.motivoDescontoOuGratuidade ?? "",
  };

  function handleSubmit(_values: AtendimentoFormValues) {
    toast.success("Atendimento atualizado", {
      description: "Protótipo — alterações não foram persistidas.",
    });
    setTimeout(() => router.push(`/atendimentos/${id}`), 600);
  }

  return (
    <>
      <Link
        href={`/atendimentos/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para o atendimento
      </Link>

      <PageHeader
        title={`Editar atendimento #${id}`}
        description={
          isProfissional
            ? "Ajuste o valor da consulta ou o prontuário. Procedimentos extras e pagamento são gerenciados pelo administrativo."
            : "Ajuste valor, procedimentos extras ou status de pagamento"
        }
      />

      <AtendimentoForm
        mode="edit"
        initial={initial}
        enableProntuarioFields
        lockIdentity={isProfissional}
        lockProcedimentos={isProfissional}
        lockPayment={isProfissional}
        cancelHref={`/atendimentos/${id}`}
        onSubmit={handleSubmit}
      />
    </>
  );
}
