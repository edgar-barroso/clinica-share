"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { HeartPulse, UserPlus } from "lucide-react";
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
import { apiRegister, authErrorMessage } from "@/lib/auth-client";

export default function PatientSignUpPage() {
  const router = useRouter();
  const { setUser } = useRole();
  const [loading, setLoading] = useState(false);
  const [accept, setAccept] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!accept) {
      toast.error("É preciso aceitar os termos para criar a conta.");
      return;
    }
    setLoading(true);
    try {
      const { user } = await apiRegister({ nome, email, telefone, senha });
      setUser(user);
      toast.success("Conta criada · entrando no portal…");
      router.push("/p");
      router.refresh();
    } catch (err) {
      toast.error(authErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <HeartPulse size={22} />
            </div>
            <h1 className="mt-4 text-2xl font-bold">Criar conta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Portal do paciente ClinicaShare.
            </p>
          </div>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Seus dados</CardTitle>
              <CardDescription>
                Cadastre-se com Google ou preencha o formulário.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <GoogleButton mode="cadastrar" />

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
                  <Label htmlFor="nome">Nome completo</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="João da Silva"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    autoComplete="name"
                    required
                  />
                </div>
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
                  <Label htmlFor="telefone">Celular com WhatsApp</Label>
                  <Input
                    id="telefone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    autoComplete="tel"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Usado para lembretes de consulta.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    minLength={8}
                    autoComplete="new-password"
                    required
                  />
                </div>

                <label className="flex items-start gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={accept}
                    onChange={(e) => setAccept(e.target.checked)}
                    className="mt-0.5 size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span>
                    Li e aceito os{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Termos de uso
                    </Link>{" "}
                    e a{" "}
                    <Link href="#" className="text-primary hover:underline">
                      Política de privacidade (LGPD)
                    </Link>
                    .
                  </span>
                </label>

                <Button type="submit" className="w-full" disabled={loading}>
                  <UserPlus size={16} />
                  {loading ? "Criando conta…" : "Criar conta"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                Já tem conta?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline"
                >
                  Entrar
                </Link>
              </p>
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
