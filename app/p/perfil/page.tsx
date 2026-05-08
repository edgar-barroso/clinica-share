'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { LogOut, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layouts/page-header';
import { getPaciente } from '@/lib/mock/data';
import { useCurrentUser } from '@/lib/current-user';

export default function PerfilPage() {
  const router = useRouter();
  const { pacienteId } = useCurrentUser();

  useEffect(() => {
    if (!pacienteId) router.replace('/entrar');
  }, [pacienteId, router]);

  if (!pacienteId) return null;

  const paciente = getPaciente(pacienteId);
  if (!paciente) return null;

  return (
    <>
      <PageHeader title="Meu perfil" description="Seus dados pessoais e de contato" />

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

        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sair</CardTitle>
            </CardHeader>
            <CardContent>
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.localStorage.removeItem('clinicashare:role');
                  }
                  toast.success('Sessão encerrada');
                  router.push('/entrar');
                }}
                className={cn(
                  'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10',
                )}
              >
                <LogOut size={16} />
                Encerrar sessão
              </button>
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

