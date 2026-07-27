'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { CalendarCheck2, LogIn, ShieldCheck, Stethoscope, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GoogleButton } from '@/components/auth/google-button';
import { useRole } from '@/lib/role';
import { apiLogin, authErrorMessage, ROLE_REDIRECT } from '@/lib/auth-client';

export default function LoginPage() {
  const router = useRouter();
  const { setUser } = useRole();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  // [RF-024] O proxy (token expirado) e o IdleSessionGuard (timer do
  // cliente) mandam pra cá com `expirada=1`. Lido de `window.location` em
  // vez de `useSearchParams` para não exigir boundary de Suspense.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('expirada') === '1') {
      toast.warning('Sua sessão foi encerrada por inatividade. Entre novamente.');
    }
  }, []);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await apiLogin({ email, senha });
      // Popula o user no context imediatamente — evita race com /api/auth/me
      setUser(user);
      toast.success('Bem-vindo de volta!');
      router.push(ROLE_REDIRECT[user.role]);
      router.refresh();
    } catch (err) {
      toast.error(authErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="grid flex-1 lg:grid-cols-2">
        <div className="hidden items-center justify-center bg-primary p-12 text-primary-foreground lg:flex">
          <div className="max-w-md space-y-8">
            <div className="flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Stethoscope size={24} />
              </div>
              <span className="text-xl font-semibold">ClinicaShare</span>
            </div>
            <div className="space-y-3">
              <h1 className="text-3xl font-bold leading-tight">Sua clínica, suas consultas em um lugar só.</h1>
              <p className="text-primary-foreground/80">Plataforma da clínica multiprofissional do Dr. Edson Andrade para profissionais, equipe e pacientes.</p>
            </div>
            <ul className="space-y-3 text-sm">
              <FeatureItem icon={CalendarCheck2} title="Agenda compartilhada" description="Profissionais e pacientes acompanham as mesmas consultas, sem ruído." />
              <FeatureItem icon={Wallet} title="Pagamento presencial" description="Nada é cobrado antes da consulta. Você paga direto no atendimento." />
              <FeatureItem icon={ShieldCheck} title="Trilha de auditoria" description="Toda alteração financeira fica registrada com quem fez e quando." />
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-sm">
            <CardHeader className="space-y-2">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Stethoscope size={20} />
              </div>
              <CardTitle>Acessar minha conta</CardTitle>
              <CardDescription>Use suas credenciais para entrar. O sistema reconhece seu perfil automaticamente — paciente, profissional ou equipe da clínica.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GoogleButton mode="entrar" />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link href="/esqueci-senha" className="text-xs text-primary hover:underline">
                      Esqueci minha senha
                    </Link>
                  </div>
                  <Input id="password" type="password" placeholder="••••••••" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn size={16} />
                  {loading ? 'Entrando…' : 'Entrar'}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-muted-foreground">
                Ainda não tem conta?{' '}
                <Link href="/cadastrar" className="font-medium text-primary hover:underline">
                  Cadastre-se
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t border-border bg-card px-6 py-4 text-center text-xs text-muted-foreground">© 2026 ClinicaShare · Desenvolvido por DevsTech · Projeto acadêmico</footer>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, description }: { icon: typeof Stethoscope; title: string; description: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-primary-foreground backdrop-blur">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="font-medium">{title}</p>
        <p className="text-primary-foreground/75">{description}</p>
      </div>
    </li>
  );
}
