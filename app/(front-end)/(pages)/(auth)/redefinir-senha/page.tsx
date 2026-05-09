"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, KeyRound, Stethoscope, X } from "lucide-react";
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
import { apiResetPassword, authErrorMessage } from "@/lib/auth-client";

function check(cond: boolean, label: string) {
  return (
    <li className="flex items-center gap-1.5 text-xs">
      {cond ? (
        <Check size={12} className="text-success" />
      ) : (
        <X size={12} className="text-muted-foreground" />
      )}
      <span className={cond ? "text-success" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function RedefinirSenhaForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [loading, setLoading] = useState(false);

  const regras = useMemo(
    () => ({
      minLength: senha.length >= 8,
      hasUpper: /[A-Z]/.test(senha),
      hasNumber: /\d/.test(senha),
      match: senha.length > 0 && senha === confirma,
    }),
    [senha, confirma],
  );

  const valida = Object.values(regras).every(Boolean);
  const linkInvalido = !token || !email;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valida) {
      toast.warning("Preencha a nova senha seguindo as regras");
      return;
    }
    setLoading(true);
    try {
      await apiResetPassword({ email, token, novaSenha: senha });
      toast.success("Senha redefinida com sucesso");
      router.push("/login");
    } catch (err) {
      toast.error(authErrorMessage(err));
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Stethoscope size={20} />
        </div>
        <CardTitle>Criar nova senha</CardTitle>
        <CardDescription>
          {linkInvalido
            ? "Link inválido ou expirado. Solicite um novo em \"Esqueci minha senha\"."
            : "Defina uma senha forte para voltar a acessar sua conta. O link é válido por 30 minutos."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {linkInvalido ? (
          <Link
            href="/esqueci-senha"
            className="inline-block text-sm text-primary hover:underline"
          >
            Solicitar novo link
          </Link>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="senha">Nova senha</Label>
              <Input
                id="senha"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="new-password"
                autoFocus
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirma">Confirmar nova senha</Label>
              <Input
                id="confirma"
                type="password"
                placeholder="Repita a nova senha"
                value={confirma}
                onChange={(e) => setConfirma(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <ul className="space-y-1 rounded-xl bg-muted/60 p-3">
              {check(regras.minLength, "Pelo menos 8 caracteres")}
              {check(regras.hasUpper, "1 letra maiúscula")}
              {check(regras.hasNumber, "1 número")}
              {check(regras.match, "Senhas coincidem")}
            </ul>

            <Button type="submit" className="w-full" disabled={!valida || loading}>
              <KeyRound size={16} />
              {loading ? "Redefinindo…" : "Redefinir senha"}
            </Button>

            <Link
              href="/login"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar e voltar ao login
            </Link>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Suspense fallback={null}>
          <RedefinirSenhaForm />
        </Suspense>
      </div>
    </div>
  );
}
