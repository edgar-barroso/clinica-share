"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Copy, KeyRound, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { apiCreatePaciente, type Paciente } from "@/lib/api/pacientes";
import { apiErrorMessage } from "@/lib/api-client";

// Garante que `createPortal` só roda no client. No SSR, retorna null.
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Portal pra fora do DOM atual — evita que o dialog (que tem `<form>`
 * interno) caia dentro de um `<form>` da página chamadora (caso típico:
 * /agenda/novo). Forms aninhados são inválidos em HTML; o browser faz
 * unwrap e o submit do dialog dispara o form errado.
 */
function DialogPortal({ children }: { children: ReactNode }) {
  const isClient = useIsClient();
  if (!isClient) return null;
  return createPortal(children, document.body);
}

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
  // Após cadastrar, exibimos um passo final com a senha temporária
  // gerada para o paciente. O atendente repassa para o paciente.
  const [senhaTemporaria, setSenhaTemporaria] = useState<string | null>(null);
  const [pacienteCriado, setPacienteCriado] = useState<Paciente | null>(null);

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
      const { paciente, senhaTemporaria: senha } = await apiCreatePaciente({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        cpf: cpf.trim() || null,
        dataNascimento: dataNascimento || null,
        sexo: sexo || null,
      });
      toast.success("Paciente cadastrado");
      // Exibe o passo final com a senha. Só fechamos o dialog quando
      // o atendente confirma que anotou/passou a senha.
      setPacienteCriado(paciente);
      setSenhaTemporaria(senha);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function copiarSenha() {
    if (!senhaTemporaria) return;
    try {
      await navigator.clipboard.writeText(senhaTemporaria);
      toast.success("Senha copiada");
    } catch {
      toast.error("Não foi possível copiar — copie manualmente");
    }
  }

  function concluir() {
    if (pacienteCriado) onCreate(pacienteCriado);
  }

  if (senhaTemporaria && pacienteCriado) {
    return (
      <DialogPortal>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        />
        <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
          <div className="mb-4 flex items-start gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <KeyRound size={18} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold">
                Paciente cadastrado — anote a senha temporária
              </h2>
              <p className="text-xs text-muted-foreground">
                Esta senha é exibida apenas uma vez. Repasse para o paciente
                agora; ele troca depois em &quot;Meu perfil&quot;.
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {pacienteCriado.nome}
            </p>
            <p className="text-sm text-muted-foreground">
              {pacienteCriado.email}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-dashed border-border bg-background p-3">
              <code className="text-lg font-bold tracking-wider tabular-nums">
                {senhaTemporaria}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copiarSenha}
              >
                <Copy size={12} />
                Copiar
              </Button>
            </div>
          </div>

          <Button type="button" className="w-full" onClick={concluir}>
            Já anotei — concluir
          </Button>
        </div>
      </div>
      </DialogPortal>
    );
  }

  return (
    <DialogPortal>
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
    </DialogPortal>
  );
}
