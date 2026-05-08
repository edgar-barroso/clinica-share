"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GoogleLogin } from "@react-oauth/google";
import { toast } from "sonner";
import { apiGoogle, authErrorMessage, ROLE_REDIRECT } from "@/lib/auth-client";
import { useRole } from "@/lib/role";

interface Props {
  mode: "entrar" | "cadastrar";
  redirectTo?: string;
}

export function GoogleButton({ mode, redirectTo }: Props) {
  const router = useRouter();
  const { setRole } = useRole();
  const [loading, setLoading] = useState(false);

  async function handleCredential(credential: string | undefined) {
    if (!credential) {
      toast.error("Não foi possível obter credencial do Google");
      return;
    }
    setLoading(true);
    try {
      const { user } = await apiGoogle({ idToken: credential });
      setRole(user.role);
      toast.success(
        mode === "entrar" ? "Bem-vindo de volta!" : "Conta criada com sucesso!",
      );
      router.push(redirectTo ?? ROLE_REDIRECT[user.role]);
      router.refresh();
    } catch (err) {
      toast.error(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full" aria-busy={loading}>
      <GoogleLogin
        onSuccess={(resp) => handleCredential(resp.credential)}
        onError={() => toast.error("Falha no login com Google")}
        useOneTap={false}
        theme="outline"
        size="large"
        text={mode === "entrar" ? "signin_with" : "signup_with"}
      />
    </div>
  );
}
