"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Mail, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EsqueciSenhaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Instruções enviadas", {
        description: "Em produção, um e-mail com link seguro seria enviado.",
      });
      router.push("/redefinir-senha");
    }, 600);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          Voltar ao login
        </Link>
        <Card>
          <CardHeader className="space-y-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Stethoscope size={20} />
            </div>
            <CardTitle>Recuperar senha</CardTitle>
            <CardDescription>
              Informe o e-mail cadastrado e vamos enviar um link para você criar uma
              nova senha (RF-026).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail cadastrado</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                <Mail size={16} />
                {loading ? "Enviando…" : "Enviar instruções"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
