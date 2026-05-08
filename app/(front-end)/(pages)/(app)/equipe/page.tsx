"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Headset, Mail, Phone, Plus, Wallet } from "lucide-react";
import { toast } from "sonner";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import { apiListStaff, type Staff, type CargoStaff } from "@/lib/api/staff";
import { apiErrorMessage } from "@/lib/api-client";

function initials(name: string) {
  const parts = name
    .split(" ")
    .filter((p) => !["Dr.", "Dra.", "Sr.", "Sra."].includes(p));
  return (parts[0]?.[0] ?? "") + (parts[parts.length - 1]?.[0] ?? "");
}

const CARGO_LABEL: Record<CargoStaff, string> = {
  atendente: "Atendentes",
  auxiliar: "Auxiliares Financeiros",
};

const CARGO_DESC: Record<CargoStaff, string> = {
  atendente: "Recebem pacientes, agendam consultas e registram chegada/saída",
  auxiliar:
    "Conferem repasses semanais, registram pagamentos e auditam atendimentos",
};

const CARGO_ICON: Record<CargoStaff, typeof Headset> = {
  atendente: Headset,
  auxiliar: Wallet,
};

export default function EquipePage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListStaff()
      .then((res) => setStaff(res.staff))
      .catch((err) => toast.error(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const grupos: CargoStaff[] = ["atendente", "auxiliar"];

  return (
    <>
      <PageHeader
        title="Equipe da clínica"
        description="Atendentes e auxiliares financeiros com acesso ao sistema"
        actions={
          <Link href="/equipe/novo" className={buttonVariants()}>
            <Plus size={16} />
            Novo membro
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((cargo) => {
            const lista = staff.filter((s) => s.cargo === cargo);
            const Icon = CARGO_ICON[cargo];
            return (
              <section key={cargo}>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={16} />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">
                      {CARGO_LABEL[cargo]}{" "}
                      <span className="text-muted-foreground">({lista.length})</span>
                    </h2>
                    <p className="text-xs text-muted-foreground">{CARGO_DESC[cargo]}</p>
                  </div>
                </div>

                {lista.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-sm text-muted-foreground">
                      Nenhum {cargo === "atendente" ? "atendente" : "auxiliar"} cadastrado.
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-0">
                      <div className="divide-y divide-border">
                        {lista.map((s) => (
                          <StaffRow key={s.id} s={s} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function StaffRow({ s }: { s: Staff }) {
  return (
    <Link
      href={`/equipe/${s.id}`}
      className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/40 lg:flex-row lg:items-center"
    >
      <div className="flex flex-1 items-center gap-4">
        <Avatar className="size-11 bg-primary/10 text-primary">
          <AvatarFallback>{initials(s.nome)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold">{s.nome}</p>
            {s.ativo ? (
              <Badge variant="success">Ativo</Badge>
            ) : (
              <Badge variant="secondary">Inativo</Badge>
            )}
            {s.senhaDefinida === false && (
              <Badge variant="warning">Acesso pendente</Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail size={12} /> {s.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone size={12} /> {s.telefone}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
