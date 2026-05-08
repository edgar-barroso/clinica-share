"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Mail, Phone, Plus, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layouts/page-header";
import { apiListProfissionais, type Profissional } from "@/lib/api/profissionais";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatPercent } from "@/lib/format";

function initials(name: string) {
  const parts = name.split(" ").filter((p) => !["Dr.", "Dra.", "Sr.", "Sra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

export default function ProfissionaisPage() {
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListProfissionais()
      .then((res) => setProfissionais(res.profissionais))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Profissionais"
        description="Médicos, psicólogos, fisioterapeutas e demais profissionais que utilizam a clínica"
        actions={
          <Link href="/profissionais/novo" className={buttonVariants()}>
            <Plus size={16} />
            Novo profissional
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : profissionais.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="Nenhum profissional cadastrado"
          description="Cadastre o primeiro profissional para começar a marcar consultas."
          action={
            <Link href="/profissionais/novo" className={buttonVariants()}>
              <Plus size={16} />
              Novo profissional
            </Link>
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {profissionais.map((p) => (
                <Link
                  key={p.id}
                  href={`/profissionais/${p.id}`}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center"
                >
                  <div className="flex flex-1 items-center gap-4">
                    <Avatar className="size-11 bg-primary/10 text-primary">
                      <AvatarFallback>{initials(p.nome)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-semibold">{p.nome}</p>
                        {p.ativo ? (
                          <Badge variant="success">Ativo</Badge>
                        ) : (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {p.especialidade} · {p.conselho}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {p.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {p.telefone}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 lg:flex lg:items-center lg:gap-8">
                    <div>
                      <p className="text-xs text-muted-foreground">Contrato</p>
                      <p className="text-sm font-medium">
                        {p.modalidadeContrato === "percentual"
                          ? `Percentual ${p.percentualRepasse ? formatPercent(Number(p.percentualRepasse)) : ""}`
                          : `Aluguel ${p.valorAluguelPorTurno ? formatBRL(Number(p.valorAluguelPorTurno)) : ""}/turno`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duração padrão</p>
                      <p className="text-sm font-medium tabular-nums">
                        {p.duracaoConsultaMinutos} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Turnos fixos</p>
                      <p className="text-sm font-medium tabular-nums">
                        {p.turnosFixos?.length ?? 0}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
