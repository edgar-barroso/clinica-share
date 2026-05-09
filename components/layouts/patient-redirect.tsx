"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRole } from "@/lib/role";

/**
 * Se o usuário logado for paciente, redireciona para o portal do paciente.
 * Usado dentro do AppShell (/(app)) — evita que um paciente veja a área admin.
 *
 * Aguarda `loading=false` antes de decidir, pois `RoleProvider` inicia com
 * role="paciente" como default antes da resposta de /api/auth/me chegar.
 */
export function PatientRedirect() {
  const { role, loading, user } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && role === "paciente") {
      router.replace("/p");
    }
  }, [role, loading, user, router]);

  return null;
}
