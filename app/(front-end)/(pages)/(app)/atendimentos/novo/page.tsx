"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layouts/page-header";
import {
  AtendimentoForm,
  type AtendimentoFormValues,
} from "@/components/atendimento/atendimento-form";
import { atendimentos } from "@/lib/mock/data";

export default function NovoAtendimentoPage() {
  return (
    <Suspense fallback={null}>
      <NovoAtendimentoPageInner />
    </Suspense>
  );
}

function NovoAtendimentoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromId = searchParams.get("from");

  const origem = useMemo(
    () => (fromId ? atendimentos.find((a) => a.id === fromId) : undefined),
    [fromId],
  );

  const initial: Partial<AtendimentoFormValues> | undefined = origem
    ? {
        data: origem.data,
        hora: origem.hora,
        pacienteId: origem.pacienteId,
        profissionalId: origem.profissionalId,
        consultorioId: origem.consultorioId,
        valorConsulta: origem.valorConsulta,
        usaProntuarioExterno: origem.usaProntuarioExterno,
        prontuario: origem.prontuarioInterno,
        statusPagamento: origem.statusPagamento,
      }
    : undefined;

  function handleSubmit(_values: AtendimentoFormValues) {
    toast.success("Atendimento registrado", {
      description: origem
        ? `Finalização do agendamento #${origem.id} · protótipo, não persistido`
        : "Registro avulso (walk-in) · protótipo, não persistido",
    });
    setTimeout(() => router.push("/atendimentos"), 600);
  }

  return (
    <>
      <PageHeader
        title={origem ? "Finalizar atendimento" : "Registrar atendimento avulso"}
        description={
          origem
            ? "Confirme o valor e o pagamento da consulta realizada."
            : "Use este fluxo apenas para walk-in ou ajuste retroativo, sem agendamento prévio."
        }
      />

      <AtendimentoForm
        mode="create"
        initial={initial}
        lockIdentity={!!origem}
        enableProntuarioFields={!!origem}
        callout={
          origem
            ? {
                title: `Finalizando agendamento #${origem.id}`,
                description:
                  "Paciente, profissional, consultório e horário vêm do agendamento e não podem ser alterados. Ajuste valor e pagamento conforme o atendido.",
              }
            : {
                title: "Registro avulso — sem agendamento prévio",
                description:
                  "Use este formulário apenas quando o paciente não passou pelo fluxo de agendamento (ex.: walk-in, ajuste de histórico). O caminho padrão é finalizar pela agenda do dia.",
              }
        }
        cancelHref="/atendimentos"
        submitLabel={origem ? "Finalizar atendimento" : undefined}
        onSubmit={handleSubmit}
      />
    </>
  );
}
