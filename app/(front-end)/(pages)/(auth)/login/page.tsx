"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, LogIn, ShieldAlert, Stethoscope, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { useRole, type Role } from "@/lib/role";

type EquipeRole = Extract<Role, "admin" | "auxiliar" | "profissional" | "atendente">;

const ROLE_REDIRECT: Record<EquipeRole, string> = {
  admin: "/dashboard",
  auxiliar: "/dashboard",
  profissional: "/dashboard",
  atendente: "/agenda",
};

export default function LoginPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [loading, setLoading] = useState(false);
  const [roleSelecionado, setRoleSelecionado] = useState<EquipeRole>("admin");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Protótipo: aceita qualquer credencial
    setTimeout(() => {
      setRole(roleSelecionado);
      toast.success("Entrando no sistema…");
      router.push(ROLE_REDIRECT[roleSelecionado]);
    }, 400);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-xs font-medium text-warning">
        <ShieldAlert size={14} />
        <span>Protótipo · qualquer e-mail e senha funcionam</span>
      </div>

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
            <div className="flex gap-4 pt-4 text-sm">
              <div>
                <p className="text-3xl font-semibold tabular-nums">12</p>
                <p className="text-primary-foreground/70">consultórios</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tabular-nums">5</p>
                <p className="text-primary-foreground/70">perfis de usuário</p>
              </div>
              <div>
                <p className="text-3xl font-semibold tabular-nums">7h-20h</p>
                <p className="text-primary-foreground/70">funcionamento</p>
              </div>
            </div>
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
                    defaultValue="edson.andrade@clinicashare.com.br"
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
                  <Input id="password" type="password" defaultValue="protótipo" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="perfil">Perfil de acesso</Label>
                  <Select
                    id="perfil"
                    value={roleSelecionado}
                    onChange={(e) => setRoleSelecionado(e.target.value as EquipeRole)}
                    required
                  >
                    <option value="admin">Administrador</option>
                    <option value="auxiliar">Auxiliar Financeiro</option>
                    <option value="profissional">Profissional</option>
                    <option value="atendente">Atendente</option>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Protótipo: sem credenciais reais, o perfil define a visão que você verá ao entrar.
                  </p>
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
