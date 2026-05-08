'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import {
  Calendar,
  IdCard,
  LogOut,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/layouts/page-header';
import { getPaciente } from '@/lib/mock/data';
import { useCurrentUser } from '@/lib/current-user';
import { formatDateLong } from '@/lib/format';

const SEXO_LABEL: Record<'M' | 'F' | 'outro', string> = {
  M: 'Masculino',
  F: 'Feminino',
  outro: 'Outro / Prefiro não informar',
};

function calcularIdade(dataNascimento: string): number {
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;
  return idade;
}

export default function PerfilPage() {
  const router = useRouter();
  const { pacienteId } = useCurrentUser();

  useEffect(() => {
    if (!pacienteId) router.replace('/entrar');
  }, [pacienteId, router]);

  if (!pacienteId) return null;

  const paciente = getPaciente(pacienteId);
  if (!paciente) return null;

  const enderecoCompleto = paciente.endereco
    ? `${paciente.endereco.rua}, ${paciente.endereco.numero} · ${paciente.endereco.cidade}/${paciente.endereco.uf}`
    : null;

  return (
    <>
      <PageHeader title="Meu perfil" description="Seus dados pessoais, contato, endereço e plano de saúde" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Identidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
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
                  <p className="text-sm text-muted-foreground">
                    {paciente.dataNascimento
                      ? `${calcularIdade(paciente.dataNascimento)} anos · paciente desde abril de 2026`
                      : 'Paciente desde abril de 2026'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2">
                <InfoItem
                  icon={IdCard}
                  label="CPF"
                  value={paciente.cpf ?? 'Não informado'}
                />
                <InfoItem
                  icon={Calendar}
                  label="Data de nascimento"
                  value={
                    paciente.dataNascimento
                      ? formatDateLong(paciente.dataNascimento)
                      : 'Não informado'
                  }
                />
                <InfoItem
                  icon={User}
                  label="Sexo"
                  value={paciente.sexo ? SEXO_LABEL[paciente.sexo] : 'Não informado'}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoItem
                icon={Mail}
                label="E-mail"
                value={paciente.email || 'Não informado'}
              />
              <InfoItem icon={Phone} label="Telefone" value={paciente.telefone} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Endereço</CardTitle>
            </CardHeader>
            <CardContent>
              {paciente.endereco ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem
                    icon={MapPin}
                    label="CEP"
                    value={paciente.endereco.cep}
                  />
                  <InfoItem
                    icon={MapPin}
                    label="Cidade / UF"
                    value={`${paciente.endereco.cidade}/${paciente.endereco.uf}`}
                  />
                  <div className="sm:col-span-2">
                    <InfoItem
                      icon={MapPin}
                      label="Logradouro"
                      value={enderecoCompleto ?? 'Não informado'}
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Endereço não cadastrado.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>Plano de saúde</CardTitle>
              {paciente.plano ? (
                <Badge variant={paciente.plano.temPlano ? 'success' : 'secondary'}>
                  {paciente.plano.temPlano ? 'Com plano' : 'Particular'}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent>
              {paciente.plano?.temPlano ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoItem
                    icon={Shield}
                    label="Operadora"
                    value={paciente.plano.operadora ?? 'Não informado'}
                  />
                  <InfoItem
                    icon={Shield}
                    label="Nº da carteirinha"
                    value={paciente.plano.numeroCarteirinha ?? 'Não informado'}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {paciente.plano
                    ? 'Você é atendido como paciente particular.'
                    : 'Plano de saúde não informado no cadastro.'}
                </p>
              )}
            </CardContent>
          </Card>

          <div>
            <Link
              href="/p/perfil/editar"
              className={buttonVariants({ variant: 'outline' })}
            >
              <Pencil size={14} />
              Editar informações
            </Link>
          </div>
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
