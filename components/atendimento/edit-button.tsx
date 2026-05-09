"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/current-user";

interface Props {
  atendimentoId: string;
  atendimentoProfissionalId: string;
}

export function EditAtendimentoButton({
  atendimentoId,
  atendimentoProfissionalId,
}: Props) {
  const { role, profissionalId } = useCurrentUser();
  const canEditByRole =
    role === "admin" || role === "auxiliar" || role === "profissional";

  if (!canEditByRole) return null;
  if (role === "profissional" && profissionalId !== atendimentoProfissionalId)
    return null;

  return (
    <Link
      href={`/atendimentos/${atendimentoId}/editar`}
      className={buttonVariants({ variant: "outline" })}
    >
      <Pencil size={14} />
      Editar
    </Link>
  );
}
