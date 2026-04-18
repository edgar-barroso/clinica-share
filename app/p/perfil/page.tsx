"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  ChevronRight,
  FileLock2,
  LogOut,
  Mail,
  MessageCircle,
  Phone,
  Shield,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPaciente } from "@/lib/mock/data";

const PACIENTE_ID = "pt01";

export default function PerfilPage() {
  const paciente = getPaciente(PACIENTE_ID)!;
  const [notifWhats, setNotifWhats] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <Avatar className="size-16 bg-primary/10 text-lg text-primary">
          <AvatarFallback>
            {paciente.nome
              .split(" ")
              .map((p) => p[0])
              .slice(0, 2)
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{paciente.nome}</h1>
          <p className="text-sm text-muted-foreground">Paciente desde abril de 2026</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardContent className="space-y-3 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Contato
          </p>
          <InfoItem icon={Mail} label="E-mail" value={paciente.email} />
          <InfoItem icon={Phone} label="Telefone" value={paciente.telefone} />
          <Button variant="outline" className="w-full">
            Editar informações
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="space-y-4 p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Lembretes e notificações (AG07)
          </p>
          <ToggleRow
            icon={MessageCircle}
            label="Lembretes via WhatsApp"
            description="2 dias antes, 1 dia antes e no dia da consulta"
            checked={notifWhats}
            onToggle={() => {
              setNotifWhats((v) => !v);
              toast.success(
                notifWhats
                  ? "Lembretes por WhatsApp desativados"
                  : "Lembretes por WhatsApp ativados",
              );
            }}
          />
          <ToggleRow
            icon={Bell}
            label="Notificações por e-mail"
            description="Confirmações e recibos"
            checked={notifEmail}
            onToggle={() => {
              setNotifEmail((v) => !v);
              toast.success(
                notifEmail
                  ? "Notificações por e-mail desativadas"
                  : "Notificações por e-mail ativadas",
              );
            }}
          />
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="divide-y divide-border p-0">
          <MenuItem
            icon={Shield}
            label="Privacidade e LGPD"
            href="#"
            subtitle="Seus dados, direitos e consentimentos"
          />
          <MenuItem
            icon={FileLock2}
            label="Recibos e comprovantes"
            href="#"
            subtitle="Histórico de pagamentos"
          />
        </CardContent>
      </Card>

      <Link
        href="/login"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 text-sm font-medium text-destructive hover:bg-muted"
      >
        <LogOut size={16} />
        Sair da conta
      </Link>

      <p className="mt-8 text-center text-[11px] text-muted-foreground">
        ClinicaShare · Protótipo v0.1.0 · DevsTech
      </p>
    </>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({
  icon: Icon,
  label,
  description,
  checked,
  onToggle,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  subtitle,
  href,
}: {
  icon: typeof Shield;
  label: string;
  subtitle?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex size-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
        <Icon size={15} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <ChevronRight size={14} className="text-muted-foreground" />
    </Link>
  );
}
