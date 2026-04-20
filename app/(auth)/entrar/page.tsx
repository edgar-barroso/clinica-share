"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowRight, HeartPulse, LogIn, ShieldAlert } from "lucide-react";
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
import { GoogleButton } from "@/components/auth/google-button";
import { useRole } from "@/lib/role";

export default function PatientLoginPage() {
  const router = useRouter();
  const { setRole } = useRole();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setRole("paciente");
      toast.success("Entrando no portal…");
      router.push("/p");
    }, 400);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex items-center justify-center gap-2 bg-warning/15 px-4 py-1.5 text-xs font-medium text-warning">
        <ShieldAlert size={14} />
        <span>Protótipo · qualquer e-mail e senha funcionam</span>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <HeartPulse size={22} />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Portal do paciente</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Agende consultas, acompanhe seu histórico e receba lembretes.
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Entrar</CardTitle>
              <CardDescription>
                Use sua conta ClinicaShare ou entre com Google.
              </CardDescription>
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
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    defaultValue="joao.silva@gmail.com"
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
                    defaultValue="protótipo"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  <LogIn size={16} />
                  {loading ? "Entrando…" : "Entrar"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Primeira vez aqui?{" "}
                <Link
                  href="/cadastrar"
                  className="font-medium text-primary hover:underline"
                >
                  Criar conta
                </Link>
              </p>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground hover:underline"
            >
              Sou da equipe da clínica
              <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-card px-6 py-4 text-center text-xs text-muted-foreground">
        © 2026 ClinicaShare · Desenvolvido por DevsTech · Projeto acadêmico
      </footer>
    </div>
  );
}
