'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Headset, Mail, Pencil, Phone, Trash2, Wallet, X } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layouts/page-header';
import { apiGetStaff, apiDeactivateStaff, type Staff, type CargoStaff } from '@/lib/api/staff';
import { apiErrorMessage } from '@/lib/api-client';

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
  const router = useRouter();
  const [staff, setStaff] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    apiGetStaff(id)
      .then((res) => setStaff(res.staff))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  async function remover() {
    if (!staff) return;
    try {
      await apiDeactivateStaff(staff.id);
      toast.success(`${staff.nome} desativado`);
      router.push('/equipe');
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <>
        <Skeleton className="mb-4 h-5 w-32" />
        <Skeleton className="mb-6 h-12 w-full max-w-md" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-44 lg:col-span-1" />
          <Skeleton className="h-44" />
        </div>
      </>
    );
  }

  if (!staff) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Membro não encontrado ou indisponível.</p>
        <Link href="/equipe" className={`${buttonVariants({ variant: 'outline' })} mt-4 inline-flex`}>
          <ArrowLeft size={14} />
          Voltar para equipe
        </Link>
      </Card>
    );
  }

  const Icon = CARGO_ICON[staff.cargo];

  return (
    <>
      <Link href="/equipe" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        Voltar para equipe
      </Link>

      <PageHeader
        title={staff.nome}
        description={CARGO_LABEL[staff.cargo]}
        actions={
          <div className="flex gap-2">
            <Link href={`/equipe/${staff.id}/editar`} className={buttonVariants({ variant: 'outline' })}>
              <Pencil size={16} />
              Editar
            </Link>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setConfirmRemove(true)}>
              <Trash2 size={16} />
              Desativar
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <div className="flex items-center gap-3">
            <Avatar className="size-14 bg-primary/10 text-lg text-primary">
              <AvatarFallback>{initials(staff.nome)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{staff.nome}</p>
              <p className="text-xs text-muted-foreground">{CARGO_LABEL[staff.cargo]}</p>
              <div className="mt-1 flex flex-wrap gap-1">{staff.ativo ? <Badge variant="success">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}</div>
            </div>
          </div>
          <div className="mt-4 space-y-2 text-sm">
            <p className="flex items-center gap-2 text-muted-foreground">
              <Mail size={14} /> {staff.email}
            </p>
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} /> {staff.telefone}
            </p>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Função na clínica</p>
            <Icon size={16} className="text-muted-foreground" />
          </div>
          <p className="mt-2 text-base font-semibold">{CARGO_LABEL[staff.cargo]}</p>
          <p className="mt-1 text-xs text-muted-foreground">{CARGO_DESC[staff.cargo]}</p>
        </Card>
      </div>

      {confirmRemove && <ConfirmRemoveDialog nome={staff.nome} onCancel={() => setConfirmRemove(false)} onConfirm={remover} />}
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
              <h2 className="text-base font-semibold">Desativar {nome}?</h2>
              <p className="text-xs text-muted-foreground">O acesso será revogado imediatamente. O registro continua arquivado e pode ser reativado depois.</p>
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
            Desativar
          </Button>
        </div>
      </div>
    </div>
  );
}
