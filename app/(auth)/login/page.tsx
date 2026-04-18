"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { LogIn, ShieldAlert, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    // Protótipo: aceita qualquer credencial
    setTimeout(() => {
      toast.success("Entrando no sistema…");
      router.push("/dashboard");
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
              <CardTitle>Entrar no ClinicaShare</CardTitle>
              <CardDescription>
                Use seu e-mail corporativo ou o e-mail cadastrado na clínica.
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
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn size={16} />
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>
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
