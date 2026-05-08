"use client";

import Link from "next/link";
import { ArrowLeft, Mail, MessageCircle, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageHeader } from "@/components/layouts/page-header";

interface Integracao {
  id: string;
  label: string;
  status: "ativo" | "planejado";
  descricao: string;
  pendencia?: string;
}

const INTEGRACOES: Integracao[] = [
  {
    id: "email",
    label: "E-mail (reset de senha)",
    status: "ativo",
    descricao:
      "Nodemailer + Gmail SMTP. Usado em /forgot-password e bem-vindo ao paciente.",
  },
  {
    id: "google-oauth",
    label: "Login com Google",
    status: "ativo",
    descricao:
      "@react-oauth/google + google-auth-library. Cria User automaticamente no primeiro login.",
  },
  {
    id: "whatsapp",
    label: "WhatsApp / SMS",
    status: "planejado",
    descricao:
      "Confirmação de agendamento e lembrete pré-consulta. Provedor a definir.",
    pendencia: "PEND-022 — escolher provedor (Twilio? Z-API? oficial Meta?)",
  },
  {
    id: "pagamento",
    label: "Pagamento online",
    status: "planejado",
    descricao: "Pagamento via PIX/cartão antes da consulta.",
    pendencia: "FI09 fora do MVP (DEC-E09). Pagamento exclusivamente presencial.",
  },
];

export default function IntegracoesPage() {
  return (
    <>
      <Link
        href="/configuracoes"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para configurações
      </Link>

      <PageHeader
        title="Integrações"
        description="Provedores externos e canais de comunicação"
      />

      <div className="mb-6 flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-4 text-xs text-warning">
        <ShieldAlert size={14} className="mt-0.5 shrink-0" />
        <span>
          Esta tela é informativa. Credenciais ficam em variáveis de ambiente
          (<code>.env</code>) e não são editáveis pela UI por motivos de
          segurança.
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {INTEGRACOES.map((i) => {
          const Icon = i.id === "whatsapp" ? MessageCircle : Mail;
          return (
            <Card key={i.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex size-10 items-center justify-center rounded-xl ${
                        i.status === "ativo"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <CardTitle className="text-base">{i.label}</CardTitle>
                  </div>
                  <Badge variant={i.status === "ativo" ? "success" : "outline"}>
                    {i.status === "ativo" ? "Ativo" : "Planejado"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{i.descricao}</p>
                {i.pendencia && (
                  <p className="mt-3 rounded-lg border border-dashed border-border bg-muted/30 p-2 text-xs">
                    {i.pendencia}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
