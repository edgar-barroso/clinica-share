"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  CreditCard,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layouts/page-header";

interface IntegracaoState {
  id: string;
  nome: string;
  descricao: string;
  icon: typeof MessageCircle;
  status: "configurado" | "pendente" | "planejado";
  detalhe?: string;
}

const integracoesIniciais: IntegracaoState[] = [
  {
    id: "whatsapp-ia",
    nome: "WhatsApp IA para lembretes (AG07)",
    descricao:
      "Envia lembretes automáticos via WhatsApp Business nos momentos definidos: 2 dias antes, 1 dia antes e no dia da consulta.",
    icon: MessageCircle,
    status: "pendente",
    detalhe:
      "Custo e aprovação da API WhatsApp Business a definir em R2 (PEND-022).",
  },
  {
    id: "gateway-pagamento",
    nome: "Gateway de pagamento (FI09)",
    descricao:
      "Permite ao paciente pagar a consulta via Pix, cartão ou boleto no momento do agendamento online.",
    icon: CreditCard,
    status: "planejado",
    detalhe: "Requisito FI09 (Média prioridade). Implementação planejada para F3.",
  },
  {
    id: "email-transacional",
    nome: "E-mail transacional (RF-026)",
    descricao:
      "Envio de e-mails de recuperação de senha, confirmações de agendamento e recibos.",
    icon: Mail,
    status: "planejado",
    detalhe: "Plataforma a definir (ex: SendGrid, Resend, AWS SES).",
  },
  {
    id: "ia-triagem",
    nome: "IA auxiliar (futura)",
    descricao:
      "Uso experimental de IA para triagem, sugestão de especialidade e análise de padrões de ocupação.",
    icon: Bot,
    status: "planejado",
    detalhe: "Fora do escopo do MVP. Cadastrada como ideia para fase futura.",
  },
];

const badgeVariants: Record<
  IntegracaoState["status"],
  { variant: "success" | "warning" | "secondary"; label: string }
> = {
  configurado: { variant: "success", label: "Configurado" },
  pendente: { variant: "warning", label: "Pendente" },
  planejado: { variant: "secondary", label: "Planejado" },
};

export default function IntegracoesPage() {
  const [items, setItems] = useState(integracoesIniciais);

  function alternar(id: string) {
    setItems((list) =>
      list.map((i) => {
        if (i.id !== id) return i;
        const novo =
          i.status === "configurado"
            ? { ...i, status: "pendente" as const }
            : { ...i, status: "configurado" as const };
        toast.success(
          `${i.nome}: ${novo.status === "configurado" ? "configurado" : "desconectado"}`,
          {
            description:
              "Protótipo — no sistema real, essa ação dispara conexão com o provedor.",
          },
        );
        return novo;
      }),
    );
  }

  return (
    <>
      <Link
        href="/configuracoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Configurações
      </Link>

      <PageHeader
        title="Integrações externas"
        description="Conexões com serviços de terceiros. No protótipo, nenhuma integração real é feita."
      />

      <Card className="mb-6 border-warning/40 bg-warning/5">
        <CardContent className="flex items-start gap-3 p-5">
          <AlertTriangle size={18} className="mt-0.5 text-warning" />
          <div className="text-sm">
            <p className="font-semibold">Custos e aprovações externas</p>
            <p className="mt-1 text-muted-foreground">
              As integrações marcadas como <em>pendente</em> dependem de aprovação e
              orçamento com o Dr. Edson. Ver PEND-022 (API WhatsApp) e visao-v1 §4.2.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {items.map((i) => (
          <Card key={i.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <i.icon size={20} />
                  </div>
                  <div>
                    <CardTitle className="text-base">{i.nome}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">{i.descricao}</p>
                    {i.detalhe && (
                      <p className="mt-2 text-xs text-muted-foreground">{i.detalhe}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={badgeVariants[i.status].variant}>
                    {badgeVariants[i.status].label}
                  </Badge>
                  {i.status !== "planejado" && (
                    <Button size="sm" variant="outline" onClick={() => alternar(i.id)}>
                      {i.status === "configurado" ? "Desconectar" : "Configurar"}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </>
  );
}
