"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layouts/page-header";
import { apiCreateConsultorio } from "@/lib/api/consultorios";
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

export default function NovoConsultorioPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState(TIPOS[0]);
  const [equipamentos, setEquipamentos] = useState<string[]>([]);
  const [novoEq, setNovoEq] = useState("");
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addEquipamento() {
    const v = novoEq.trim();
    if (!v) return;
    if (equipamentos.includes(v)) {
      toast.warning("Este equipamento já foi adicionado");
      return;
    }
    setEquipamentos((arr) => [...arr, v]);
    setNovoEq("");
  }

  function removeEquipamento(eq: string) {
    setEquipamentos((arr) => arr.filter((e) => e !== eq));
  }

  function toggleEspecialidade(esp: string) {
    setEspecialidades((arr) =>
      arr.includes(esp) ? arr.filter((e) => e !== esp) : [...arr, esp],
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (especialidades.length === 0) {
      toast.warning("Selecione ao menos uma especialidade compatível");
      return;
    }
    setSubmitting(true);
    try {
      await apiCreateConsultorio({
        nome,
        tipo,
        equipamentos,
        especialidadesCompativeis: especialidades,
      });
      toast.success("Consultório cadastrado");
      router.push("/consultorios");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Novo consultório"
        description="Cadastre uma sala da clínica com seu tipo, equipamentos e especialidades compatíveis (CO01)"
        actions={
          <Link href="/consultorios" className={buttonVariants({ variant: "outline" })}>
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
                  placeholder="Ex: Sala 13"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo</Label>
                <Select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  required
                >
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
                  placeholder="Ex: Otoscópio, Maca, ECG…"
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
                {equipamentos.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Nenhum equipamento adicionado ainda.
                  </p>
                )}
                {equipamentos.map((eq) => (
                  <span
                    key={eq}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                  >
                    {eq}
                    <button
                      type="button"
                      onClick={() => removeEquipamento(eq)}
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
        </div>

        <aside className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
              <CardTitle>Resumo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                Este cadastro segue o requisito <strong>CO01</strong>. Após criar, o
                consultório fica disponível para alocação de turnos por profissional
                (CO02/CO03).
              </p>
              <div className="space-y-2 rounded-xl bg-muted/50 p-3 text-xs">
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
                {submitting ? "Cadastrando..." : "Cadastrar consultório"}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
