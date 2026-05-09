"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
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
  apiGetPaciente,
  apiUpdatePaciente,
  type Paciente,
  type Sexo,
} from "@/lib/api/pacientes";
import { apiErrorMessage } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";

export default function EditarPacientePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { role, loading: userLoading } = useCurrentUser();
  const podeEditar = role === "admin" || role === "atendente";

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Identidade
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState<Sexo | "">("");

  // Endereço
  const [temEndereco, setTemEndereco] = useState(false);
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  // Plano
  const [temPlano, setTemPlano] = useState(false);
  const [operadora, setOperadora] = useState("");
  const [carteirinha, setCarteirinha] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { paciente } = await apiGetPaciente(id);
      setPaciente(paciente);
      setNome(paciente.nome);
      setEmail(paciente.email);
      setTelefone(paciente.telefone);
      setCpf(paciente.cpf ?? "");
      setDataNascimento(paciente.dataNascimento?.slice(0, 10) ?? "");
      setSexo((paciente.sexo as Sexo) ?? "");
      if (paciente.endereco) {
        setTemEndereco(true);
        setCep(paciente.endereco.cep);
        setRua(paciente.endereco.rua);
        setNumero(paciente.endereco.numero);
        setCidade(paciente.endereco.cidade);
        setUf(paciente.endereco.uf);
      }
      if (paciente.plano?.temPlano) {
        setTemPlano(true);
        setOperadora(paciente.plano.operadora ?? "");
        setCarteirinha(paciente.plano.numeroCarteirinha ?? "");
      }
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!podeEditar) {
      toast.error("Apenas admin e atendente podem editar pacientes");
      return;
    }
    setSubmitting(true);
    try {
      await apiUpdatePaciente(id, {
        nome: nome.trim(),
        email: email.trim(),
        telefone: telefone.trim(),
        cpf: cpf.trim() || null,
        dataNascimento: dataNascimento || null,
        sexo: sexo || null,
        endereco: temEndereco
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
      toast.success("Paciente atualizado");
      router.push(`/pacientes/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  if (userLoading || loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Paciente não encontrado.
      </p>
    );
  }

  if (!podeEditar) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-medium">
          Apenas admin e atendente podem editar pacientes.
        </p>
        <Link
          href={`/pacientes/${id}`}
          className="mt-4 inline-block text-sm text-primary hover:underline"
        >
          Voltar para o cadastro
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link
        href={`/pacientes/${id}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Voltar para o cadastro
      </Link>

      <PageHeader
        title={`Editar ${paciente.nome}`}
        description="Dados de identidade, contato, endereço e plano"
        actions={
          <Link
            href={`/pacientes/${id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Identidade</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="nome">Nome completo</Label>
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
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="sexo">Sexo</Label>
              <Select
                id="sexo"
                value={sexo}
                onChange={(e) => setSexo(e.target.value as Sexo | "")}
              >
                <option value="">Não informado</option>
                <option value="F">Feminino</option>
                <option value="M">Masculino</option>
                <option value="outro">Prefiro não informar</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contato</CardTitle>
            <CardDescription>
              E-mail é usado para login e troca de senha pelo paciente
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefone">Celular / WhatsApp</Label>
              <Input
                id="telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Endereço</CardTitle>
              <CardDescription>Opcional</CardDescription>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={temEndereco}
                onChange={(e) => setTemEndereco(e.target.checked)}
                className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              Tem endereço cadastrado
            </label>
          </CardHeader>
          {temEndereco && (
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-6">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  placeholder="00000-000"
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-3">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  maxLength={2}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-4">
                <Label htmlFor="rua">Rua</Label>
                <Input
                  id="rua"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  required
                />
              </div>
            </CardContent>
          )}
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Plano de saúde</CardTitle>
              <CardDescription>Opcional</CardDescription>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={temPlano}
                onChange={(e) => setTemPlano(e.target.checked)}
                className="size-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              Tem plano
            </label>
          </CardHeader>
          {temPlano && (
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="operadora">Operadora</Label>
                <Input
                  id="operadora"
                  value={operadora}
                  onChange={(e) => setOperadora(e.target.value)}
                  placeholder="Ex: Unimed, Bradesco Saúde"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="carteirinha">Número da carteirinha</Label>
                <Input
                  id="carteirinha"
                  value={carteirinha}
                  onChange={(e) => setCarteirinha(e.target.value)}
                  inputMode="numeric"
                />
              </div>
            </CardContent>
          )}
        </Card>

        <div className="flex justify-end gap-2">
          <Link
            href={`/pacientes/${id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            Cancelar
          </Link>
          <Button type="submit" disabled={submitting}>
            <Save size={14} />
            {submitting ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </>
  );
}
