"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Check, KeyRound, Stethoscope, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");

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

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valida) {
      toast.warning("Preencha a nova senha seguindo as regras");
      return;
    }
    toast.success("Senha redefinida com sucesso");
    setTimeout(() => router.push("/login"), 600);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope size={20} />
            </div>
            <CardTitle>Criar nova senha</CardTitle>
            <CardDescription>
              Defina uma senha forte para voltar a acessar sua conta. O link é válido
              por 30 minutos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="senha">Nova senha</Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirma">Confirmar nova senha</Label>
                <Input
                  id="confirma"
                  type="password"
                  value={confirma}
                  onChange={(e) => setConfirma(e.target.value)}
                  required
                />
              </div>

              <ul className="space-y-1 rounded-xl bg-muted/60 p-3">
                {check(regras.minLength, "Pelo menos 8 caracteres")}
                {check(regras.hasUpper, "1 letra maiúscula")}
                {check(regras.hasNumber, "1 número")}
                {check(regras.match, "Senhas coincidem")}
              </ul>

              <Button type="submit" className="w-full" disabled={!valida}>
                <KeyRound size={16} />
                Redefinir senha
              </Button>

              <Link
                href="/login"
                className="block text-center text-xs text-muted-foreground hover:text-foreground"
              >
                Cancelar e voltar ao login
              </Link>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
