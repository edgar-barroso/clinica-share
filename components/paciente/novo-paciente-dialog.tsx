"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ShieldAlert, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Paciente } from "@/lib/mock/types";

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

  // Identificação
  const [nome, setNome] = useState(() => (seededWithPhone ? "" : initialQuery));
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "outro" | "">("");

  // Contato
  const [telefone, setTelefone] = useState(() =>
    seededWithPhone ? initialQuery : "",
  );
  const [email, setEmail] = useState("");

  // Endereço
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  // Plano
  const [temPlano, setTemPlano] = useState(false);
  const [operadora, setOperadora] = useState("");
  const [carteirinha, setCarteirinha] = useState("");

  // Acesso
  const [senha, setSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");

  const senhasNaoConferem = useMemo(
    () =>
      senha.length > 0 && confirmaSenha.length > 0 && senha !== confirmaSenha,
    [senha, confirmaSenha],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (senhasNaoConferem) {
      toast.error("As senhas não conferem.");
      return;
    }
    const novo: Paciente = {
      id: `pt-${Date.now().toString(36)}`,
      nome: nome.trim(),
      telefone: telefone.trim(),
      email: email.trim(),
      cpf: cpf.trim() || undefined,
      dataNascimento: dataNascimento || undefined,
      sexo: sexo || undefined,
      endereco:
        cep || rua || numero || cidade || uf
          ? {
              cep: cep.trim(),
              rua: rua.trim(),
              numero: numero.trim(),
              cidade: cidade.trim(),
              uf: uf.trim().toUpperCase(),
            }
          : undefined,
      plano: temPlano
        ? {
            temPlano: true,
            operadora: operadora.trim() || undefined,
            numeroCarteirinha: carteirinha.trim() || undefined,
          }
        : { temPlano: false },
      senhaDefinida: senha.length >= 6,
    };
    onCreate(novo);
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
                Dados básicos para LGPD, agenda e portal do paciente.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <Section title="Identificação">
            <Field label="Nome completo *" full>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria da Silva"
                required
                autoFocus
              />
            </Field>
            <Field label="CPF *">
              <Input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                inputMode="numeric"
                required
              />
            </Field>
            <Field label="Data de nascimento *">
              <Input
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
                required
              />
            </Field>
            <Field label="Sexo">
              <Select
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
            </Field>
          </Section>

          <Section title="Contato">
            <Field label="Celular com WhatsApp *">
              <Input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </Field>
            <Field label="E-mail">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@email.com"
              />
            </Field>
          </Section>

          <Section title="Endereço">
            <Field label="CEP">
              <Input
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </Field>
            <Field label="Cidade">
              <Input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="São Paulo"
              />
            </Field>
            <Field label="Rua / logradouro" full>
              <Input
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                placeholder="Av. Paulista"
              />
            </Field>
            <Field label="Número">
              <Input
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="1000"
              />
            </Field>
            <Field label="UF">
              <Input
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength={2}
              />
            </Field>
          </Section>

          <Section title="Plano de saúde">
            <Field label="Tem plano de saúde?" full>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={temPlano}
                  onChange={(e) => setTemPlano(e.target.checked)}
                  className="size-4 rounded border-input"
                />
                <span>Paciente tem plano de saúde</span>
              </label>
            </Field>
            {temPlano && (
              <>
                <Field label="Operadora">
                  <Input
                    value={operadora}
                    onChange={(e) => setOperadora(e.target.value)}
                    placeholder="Ex: Unimed, SulAmérica"
                  />
                </Field>
                <Field label="Nº da carteirinha">
                  <Input
                    value={carteirinha}
                    onChange={(e) => setCarteirinha(e.target.value)}
                    placeholder="000123456789"
                  />
                </Field>
              </>
            )}
          </Section>

          <Section title="Acesso ao portal do paciente">
            <Field label="Senha (mínimo 6 caracteres) *">
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                minLength={6}
                placeholder="••••••"
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Confirmar senha *">
              <Input
                type="password"
                value={confirmaSenha}
                onChange={(e) => setConfirmaSenha(e.target.value)}
                minLength={6}
                placeholder="••••••"
                required
                autoComplete="new-password"
                aria-invalid={senhasNaoConferem || undefined}
              />
              {senhasNaoConferem && (
                <p className="mt-1 text-xs text-destructive">
                  As senhas não conferem.
                </p>
              )}
            </Field>
            <div className="sm:col-span-2">
              <div className="flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                <span>
                  Protótipo · em produção, atendente não deve digitar senha do
                  paciente. Refatorar para senha temporária + troca obrigatória
                  no 1º acesso ou link por SMS/e-mail (PEND-036).
                </span>
              </div>
            </div>
          </Section>

          <div className="flex gap-2 border-t border-border pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              <UserPlus size={14} />
              Cadastrar paciente
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  full,
  children,
}: {
  label: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${full ? "sm:col-span-2" : ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
