"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiGetMeuPerfil,
  apiUpdateMeuPerfil,
} from "@/lib/api/portal-paciente";
import { apiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";

export default function EditarPerfilPage() {
  const router = useRouter();
  const { pacienteId, loading: userLoading } = useCurrentUser();

  // Identificação
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<"M" | "F" | "outro" | "">("");

  // Contato
  const [telefone, setTelefone] = useState("");
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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!pacienteId) router.replace("/login");
  }, [pacienteId, userLoading, router]);

  const fetchData = useCallback(async () => {
    if (!pacienteId) return;
    setLoading(true);
    try {
      const { paciente } = await apiGetMeuPerfil();
      setNome(paciente.nome);
      setCpf(paciente.cpf ?? "");
      setDataNascimento(paciente.dataNascimento ?? "");
      setSexo(paciente.sexo ?? "");
      setTelefone(paciente.telefone);
      setEmail(paciente.email);
      setCep(paciente.endereco?.cep ?? "");
      setRua(paciente.endereco?.rua ?? "");
      setNumero(paciente.endereco?.numero ?? "");
      setCidade(paciente.endereco?.cidade ?? "");
      setUf(paciente.endereco?.uf ?? "");
      setTemPlano(paciente.plano?.temPlano ?? false);
      setOperadora(paciente.plano?.operadora ?? "");
      setCarteirinha(paciente.plano?.numeroCarteirinha ?? "");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [pacienteId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const enderecoCompleto = cep || rua || numero || cidade || uf;
      await apiUpdateMeuPerfil({
        nome: nome.trim(),
        telefone: telefone.trim(),
        email: email.trim(),
        cpf: cpf.trim() || null,
        dataNascimento: dataNascimento || null,
        sexo: sexo || null,
        endereco: enderecoCompleto
          ? {
              cep: cep.trim(),
              rua: rua.trim(),
              numero: numero.trim(),
              cidade: cidade.trim(),
              uf: uf.trim().toUpperCase(),
            }
          : null,
        plano: temPlano
          ? {
              temPlano: true,
              operadora: operadora.trim() || undefined,
              numeroCarteirinha: carteirinha.trim() || undefined,
            }
          : { temPlano: false },
      });
      toast.success("Perfil atualizado");
      router.push("/p/perfil");
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (userLoading || loading || !pacienteId) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-44" />
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-72 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <div className="flex justify-end gap-2">
            <Skeleton className="h-12 w-28" />
            <Skeleton className="h-12 w-44" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/p/perfil"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para o perfil
      </Link>

      <PageHeader
        title="Editar perfil"
        description="Atualize seus dados pessoais, contato, endereço e plano de saúde"
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
            <CardDescription>
              CPF e data de nascimento normalmente não mudam. Em produção,
              alterar esses campos exigirá confirmação adicional.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome">Nome completo *</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dataNascimento">Data de nascimento</Label>
              <Input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(e) => setDataNascimento(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sexo">Sexo</Label>
              <Select
                id="sexo"
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Celular com WhatsApp *</Label>
              <Input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="paciente@email.com"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={cep}
                onChange={(e) => setCep(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                placeholder="São Paulo"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="rua">Rua / logradouro</Label>
              <Input
                id="rua"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                placeholder="Av. Paulista"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="1000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="uf">UF</Label>
              <Input
                id="uf"
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plano de saúde</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={temPlano}
                onChange={(e) => setTemPlano(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <span>Tenho plano de saúde</span>
            </label>
            {temPlano && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="operadora">Operadora</Label>
                  <Input
                    id="operadora"
                    value={operadora}
                    onChange={(e) => setOperadora(e.target.value)}
                    placeholder="Ex: Unimed, SulAmérica"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="carteirinha">Nº da carteirinha</Label>
                  <Input
                    id="carteirinha"
                    value={carteirinha}
                    onChange={(e) => setCarteirinha(e.target.value)}
                    placeholder="000123456789"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/p/perfil"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            Cancelar
          </Link>
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </>
  );
}
