"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { useCurrentUser } from "@/lib/current-user";

interface Props {
  atendimentoId: string;
}

export function EditAtendimentoButton({ atendimentoId }: Props) {
  const { role } = useCurrentUser();
  const canEdit = role === "admin" || role === "auxiliar" || role === "profissional";

  if (!canEdit) return null;

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
