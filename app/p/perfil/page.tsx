'use client';

import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { Bell, ChevronRight, FileLock2, LogOut, Mail, MessageCircle, Phone, Shield } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layouts/page-header';
import { getPaciente } from '@/lib/mock/data';

const PACIENTE_ID = 'pt01';

export default function PerfilPage() {
  const paciente = getPaciente(PACIENTE_ID)!;
  const [notifWhats, setNotifWhats] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);

  return (
    <>
      <PageHeader title="Meu perfil" description="Dados pessoais, preferências de notificação e configurações de privacidade" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Identidade</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-4">
              <Avatar className="size-16 bg-primary/10 text-lg text-primary">
                <AvatarFallback>
                  {paciente.nome
                    .split(' ')
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-lg font-semibold">{paciente.nome}</p>
                <p className="text-sm text-muted-foreground">Paciente desde abril de 2026</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem icon={Mail} label="E-mail" value={paciente.email} />
              <InfoItem icon={Phone} label="Telefone" value={paciente.telefone} />
              <div className="sm:col-span-2">
                <Button variant="outline">Editar informações</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lembretes e notificações (AG07)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ToggleRow
                icon={MessageCircle}
                label="Lembretes via WhatsApp"
                description="2 dias antes, 1 dia antes e no dia da consulta"
                checked={notifWhats}
                onToggle={() => {
                  setNotifWhats((v) => !v);
                  toast.success(notifWhats ? 'Lembretes por WhatsApp desativados' : 'Lembretes por WhatsApp ativados');
                }}
              />
              <ToggleRow
                icon={Bell}
                label="Notificações por e-mail"
                description="Confirmações e recibos"
                checked={notifEmail}
                onToggle={() => {
                  setNotifEmail((v) => !v);
                  toast.success(notifEmail ? 'Notificações por e-mail desativadas' : 'Notificações por e-mail ativadas');
                }}
              />
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacidade e segurança</CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border p-0">
              <MenuItem icon={Shield} label="LGPD" subtitle="Seus dados e consentimentos" href="#" />
              <MenuItem icon={FileLock2} label="Recibos e comprovantes" subtitle="Histórico de pagamentos" href="#" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sair</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href="/login" className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                <LogOut size={16} />
                Encerrar sessão
              </Link>
              <p className="mt-3 text-center text-[11px] text-muted-foreground">ClinicaShare · v0.1.0 · DevsTech</p>
            </CardContent>
          </Card>
        </aside>
      </div>
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-lg bg-muted p-2 text-muted-foreground">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, description, checked, onToggle }: { icon: typeof Bell; label: string; description: string; checked: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon size={16} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} onClick={onToggle} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-muted'}`}>
        <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-transform ${!checked && '-translate-x-5'}`} />
      </button>
    </div>
  );
}

function MenuItem({ icon: Icon, label, subtitle, href }: { icon: typeof Shield; label: string; subtitle?: string; href: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-4 transition-colors hover:bg-muted/40">
      <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
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
