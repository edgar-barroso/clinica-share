"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetConsultorio,
  apiUpdateConsultorio,
  apiDeactivateConsultorio,
} from "@/lib/api/consultorios";
import { apiErrorMessage } from "@/lib/api-client";

const TIPOS = [
  "Consultório Clínico",
  "Consultório Especializado",
  "Consultório Pediátrico",
  "Consultório Psicológico",
  "Consultório Ginecológico",
  "Consultório Fisioterapia",
  "Consultório Nutrição",
  "Consultório Dermatológico",
  "Sala de Procedimentos",
];

const ESPECIALIDADES = [
  "Clínica geral",
  "Cardiologia",
  "Dermatologia",
  "Endocrinologia",
  "Fisioterapia",
  "Ginecologia",
  "Neurologia",
  "Nutrição",
  "Obstetrícia",
  "Oftalmologia",
  "Ortopedia",
  "Pediatria",
  "Psicologia",
  "Psiquiatria",
];

export default function EditarConsultorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [equipamentos, setEquipamentos] = useState<string[]>([]);
  const [novoEq, setNovoEq] = useState("");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    apiGetConsultorio(id)
      .then((res) => {
        const c = res.consultorio;
        setNome(c.nome);
        setTipo(c.tipo);
        setEquipamentos(c.equipamentos);
        setEspecialidades(c.especialidadesCompativeis);
      })
      .catch((err) => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else toast.error(apiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  function addEquipamento() {
    const v = novoEq.trim();
    if (!v) return;
    if (equipamentos.includes(v)) {
      toast.warning("Equipamento já está na lista");
      return;
    }
    setEquipamentos((arr) => [...arr, v]);
    setNovoEq("");
  }

  function toggleEspecialidade(esp: string) {
    setEspecialidades((arr) =>
      arr.includes(esp) ? arr.filter((e) => e !== esp) : [...arr, esp],
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (especialidades.length === 0) {
      toast.warning("Selecione ao menos uma especialidade");
      return;
    }
    setSubmitting(true);
    try {
      await apiUpdateConsultorio(id, {
        nome,
        tipo,
        equipamentos,
        especialidadesCompativeis: especialidades,
      });
      toast.success("Alterações salvas");
      router.push(`/consultorios/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function confirmarDesativacao() {
    try {
      await apiDeactivateConsultorio(id);
      toast.success("Consultório desativado");
      router.push("/consultorios");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <>
        <Skeleton className="mb-6 h-12 w-full max-w-md" />
        <Skeleton className="h-96 w-full" />
      </>
    );
  }

  if (notFound) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Consultório não encontrado.</p>
        <Link
          href="/consultorios"
          className={`${buttonVariants({ variant: "outline" })} mt-4 inline-flex`}
        >
          <ArrowLeft size={14} />
          Voltar
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Link
        href={`/consultorios/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <PageHeader
        title={`Editar ${nome}`}
        description="Altere informações, equipamentos e especialidades compatíveis"
        actions={
          <Link
            href={`/consultorios/${id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome da sala</Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo</Label>
                <Select id="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  {TIPOS.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Equipamentos disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: ECG, Dermatoscópio…"
                  value={novoEq}
                  onChange={(e) => setNovoEq(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEquipamento();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addEquipamento}>
                  <Plus size={14} />
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {equipamentos.map((eq) => (
                  <span
                    key={eq}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {eq}
                    <button
                      type="button"
                      onClick={() =>
                        setEquipamentos((arr) => arr.filter((x) => x !== eq))
                      }
                      className="rounded-full hover:bg-primary/20"
                      aria-label={`Remover ${eq}`}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Especialidades compatíveis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ESPECIALIDADES.map((esp) => {
                  const active = especialidades.includes(esp);
                  return (
                    <button
                      key={esp}
                      type="button"
                      onClick={() => toggleEspecialidade(esp)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border bg-card text-foreground hover:bg-muted"
                      }`}
                    >
                      {esp}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Zona de perigo</CardTitle>
            </CardHeader>
            <CardContent>
              {!showDelete ? (
                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 size={16} />
                  Desativar consultório
                </Button>
              ) : (
                <div className="space-y-3 rounded-xl bg-destructive/5 p-4">
                  <p className="text-sm">
                    Tem certeza? O consultório será marcado como inativo e não aparecerá
                    em novos agendamentos. Histórico permanece intacto.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDelete(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={confirmarDesativacao}
                    >
                      Confirmar desativação
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Alterações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-xs">
                <p>
                  <span className="text-muted-foreground">Equipamentos:</span>{" "}
                  <span className="font-medium">{equipamentos.length}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Especialidades:</span>{" "}
                  <span className="font-medium">{especialidades.length}</span>
                </p>
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? "Salvando..." : "Salvar alterações"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
