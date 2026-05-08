"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, LogIn, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRole } from "@/lib/role";
import { apiLogin, authErrorMessage, ROLE_REDIRECT } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    try {
      const { user } = await apiLogin({ email, senha });
      setRole(user.role);
      toast.success("Bem-vindo de volta!");
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
          <div className="max-w-md space-y-6">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
              <Stethoscope size={24} />
            </div>
            <h1 className="text-3xl font-bold leading-tight">
              Controle financeiro preciso para sua clínica multiprofissional.
            </h1>
            <p className="text-primary-foreground/80">
              Registre atendimentos, calcule repasses automaticamente e feche a semana em minutos
              — sem planilha, sem retrabalho, com trilha de auditoria.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 lg:p-12">
          <Card className="w-full max-w-sm">
            <CardHeader className="space-y-2">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                <Stethoscope size={20} />
              </div>
              <CardTitle>Acesso da equipe</CardTitle>
              <CardDescription>
                Entrada para administrador, auxiliar financeiro, profissionais e atendentes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link
                      href="/esqueci-senha"
                      className="text-xs text-primary hover:underline"
                    >
                      Esqueci minha senha
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn size={16} />
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>

              <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserRound size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">É paciente?</p>
                    <p className="text-xs text-muted-foreground">
                      Acesse o portal do paciente para agendar consultas.
                    </p>
                    <Link
                      href="/entrar"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Ir para o portal do paciente
                      <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="border-t border-border bg-card px-6 py-4 text-center text-xs text-muted-foreground">
        © 2026 ClinicaShare · Desenvolvido por DevsTech · Projeto acadêmico
      </footer>
    </div>
  );
}
