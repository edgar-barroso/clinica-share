'use client';

import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Headset, KeyRound, Mail, Pencil, Phone, ShieldCheck, Trash2, Wallet, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { PageHeader } from '@/components/layouts/page-header';
import { getStaff } from '@/lib/mock/data';
import type { CargoStaff } from '@/lib/mock/types';

const CARGO_LABEL: Record<CargoStaff, string> = {
  atendente: 'Atendente',
  auxiliar: 'Auxiliar Financeiro',
};

const CARGO_DESC: Record<CargoStaff, string> = {
  atendente: 'Recebe pacientes, agenda consultas e registra chegada/saída',
  auxiliar: 'Confere repasses semanais, registra pagamentos e audita atendimentos',
};

const CARGO_ICON: Record<CargoStaff, typeof Headset> = {
  atendente: Headset,
  auxiliar: Wallet,
};

function initials(name: string) {
  const parts = name.split(' ').filter((p) => !['Dr.', 'Dra.', 'Sr.', 'Sra.'].includes(p));
  return (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '');
}

export default function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const s = getStaff(id);
  if (!s) notFound();

  const router = useRouter();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const Icon = CARGO_ICON[s.cargo];

  function remover() {
    toast.success(`${s!.nome} removido`, {
      description: 'Acesso revogado e registro arquivado (protótipo, não persistido).',
    });
    setTimeout(() => router.push('/equipe'), 600);
  }

  function resetarSenha() {
    toast.success('Convite de redefinição enviado', {
      description: `Um link foi enviado para ${s!.email} (protótipo, não persistido).`,
    });
  }

  return (
    <>
      <Link href="/equipe" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        Voltar para equipe
      </Link>

      <PageHeader
        title={s.nome}
        description={CARGO_LABEL[s.cargo]}
        actions={
          <div className="flex gap-2">
            <Link href={`/equipe/${s.id}/editar`} className={buttonVariants({ variant: 'outline' })}>
              <Pencil size={16} />
              Editar
            </Link>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirmRemove(true)}>
              <Trash2 size={16} />
              Remover
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar className="size-14 bg-primary/10 text-lg text-primary">
              <AvatarFallback>{initials(s.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{s.nome}</p>
              <p className="text-xs text-muted-foreground">{CARGO_LABEL[s.cargo]}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {s.ativo ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                {s.senhaDefinida === false && <Badge variant="warning">Acesso pendente</Badge>}
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail size={14} /> {s.email}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} /> {s.telefone}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Função na clínica</p>
            <Icon size={16} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-base font-semibold">{CARGO_LABEL[s.cargo]}</p>
          <p className="mt-1 text-xs text-muted-foreground">{CARGO_DESC[s.cargo]}</p>
        </Card>
      </div>

      {confirmRemove && <ConfirmRemoveDialog nome={s.nome} onCancel={() => setConfirmRemove(false)} onConfirm={remover} />}
    </>
  );
}

interface ConfirmRemoveDialogProps {
  nome: string;
  onCancel: () => void;
  onConfirm: () => void;
}

function ConfirmRemoveDialog({ nome, onCancel, onConfirm }: ConfirmRemoveDialogProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" onClick={onCancel} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <Trash2 size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Remover {nome}?</h2>
              <p className="text-xs text-muted-foreground">O acesso será revogado imediatamente e o registro fica arquivado em /auditoria.</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label="Fechar" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="button" className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onConfirm}>
            Remover
          </Button>
        </div>
      </div>
    </div>
  );
}
