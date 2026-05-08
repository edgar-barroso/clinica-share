"use client";

import { useEffect, useState, type FormEvent } from "react";
import { UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiCreatePaciente, type Paciente } from "@/lib/api/pacientes";
import { apiErrorMessage } from "@/lib/api-client";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialQuery?: string;
  onCreate: (p: Paciente) => void;
}

function looksLikePhone(q: string) {
  const digits = q.replace(/\D/g, "");
  return digits.length >= 8;
}

export function NovoPacienteDialog({
  open,
  onOpenChange,
  initialQuery = "",
  onCreate,
}: Props) {
  if (!open) return null;
  return (
    <NovoPacienteDialogInner
      initialQuery={initialQuery}
      onOpenChange={onOpenChange}
      onCreate={onCreate}
    />
  );
}

function NovoPacienteDialogInner({
  initialQuery,
  onOpenChange,
  onCreate,
}: Omit<Props, "open"> & { initialQuery: string }) {
  const seededWithPhone = looksLikePhone(initialQuery);

  const [nome, setNome] = useState(() => (seededWithPhone ? "" : initialQuery));
  const [telefone, setTelefone] = useState(() =>
    seededWithPhone ? initialQuery : "",
  );
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "outro" | "">("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { paciente } = await apiCreatePaciente({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        cpf: cpf.trim() || null,
        dataNascimento: dataNascimento || null,
        sexo: sexo || null,
      });
      toast.success("Paciente cadastrado");
      onCreate(paciente);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <button
        type="button"
        aria-label="Fechar"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <UserPlus size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">Cadastrar novo paciente</h2>
              <p className="text-xs text-muted-foreground">
                Dados básicos. Paciente define a senha posteriormente via portal.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Fechar"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="np-nome">Nome completo *</Label>
              <Input
                id="np-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria da Silva"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-tel">Celular *</Label>
              <Input
                id="np-tel"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-email">E-mail *</Label>
              <Input
                id="np-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@email.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-cpf">CPF</Label>
              <Input
                id="np-cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="np-data">Data de nascimento</Label>
              <Input
                id="np-data"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="np-sexo">Sexo</Label>
              <Select
                id="np-sexo"
                value={sexo}
                onChange={(e) =>
                  setSexo(e.target.value as "M" | "F" | "outro" | "")
                }
              >
                <option value="">Selecione…</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="outro">Outro / Prefiro não informar</option>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              <UserPlus size={14} />
              {submitting ? "Cadastrando..." : "Cadastrar paciente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
