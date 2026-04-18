"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useRole } from "@/lib/role";

/**
 * Se o perfil simulado for "paciente", redireciona para o portal do paciente.
 * Usado dentro do AppShell (/(app)) — evita que um "paciente" veja a área admin.
 */
export function PatientRedirect() {
  const { role } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (role === "paciente") {
      router.replace("/p");
    }
  }, [role, router]);

  return null;
}
