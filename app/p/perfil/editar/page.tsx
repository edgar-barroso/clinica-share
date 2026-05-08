'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { PageHeader } from '@/components/layouts/page-header';
import { getPaciente } from '@/lib/mock/data';
import { useCurrentUser } from '@/lib/current-user';

export default function EditarPerfilPage() {
  const router = useRouter();
  const { pacienteId } = useCurrentUser();

  useEffect(() => {
    if (!pacienteId) router.replace('/entrar');
  }, [pacienteId, router]);

  const paciente = pacienteId ? getPaciente(pacienteId) : null;

  // Identificação
  const [nome, setNome] = useState(paciente?.nome ?? '');
  const [cpf, setCpf] = useState(paciente?.cpf ?? '');
  const [dataNascimento, setDataNascimento] = useState(paciente?.dataNascimento ?? '');
  const [sexo, setSexo] = useState<'M' | 'F' | 'outro' | ''>(paciente?.sexo ?? '');

  // Contato
  const [telefone, setTelefone] = useState(paciente?.telefone ?? '');
  const [email, setEmail] = useState(paciente?.email ?? '');

  // Endereço
  const [cep, setCep] = useState(paciente?.endereco?.cep ?? '');
  const [rua, setRua] = useState(paciente?.endereco?.rua ?? '');
  const [numero, setNumero] = useState(paciente?.endereco?.numero ?? '');
  const [cidade, setCidade] = useState(paciente?.endereco?.cidade ?? '');
  const [uf, setUf] = useState(paciente?.endereco?.uf ?? '');

  // Plano
  const [temPlano, setTemPlano] = useState(paciente?.plano?.temPlano ?? false);
  const [operadora, setOperadora] = useState(paciente?.plano?.operadora ?? '');
  const [carteirinha, setCarteirinha] = useState(paciente?.plano?.numeroCarteirinha ?? '');

  if (!pacienteId || !paciente) return null;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    toast.success('Perfil atualizado', {
      description: 'Protótipo — alterações não foram persistidas.',
    });
    setTimeout(() => router.push('/p/perfil'), 600);
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
              CPF e data de nascimento normalmente não mudam. Em produção, alterar
              esses campos exigirá confirmação adicional.
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
                onChange={(e) => setSexo(e.target.value as 'M' | 'F' | 'outro' | '')}
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

        <div className="flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-3 text-xs text-warning">
          <ShieldAlert size={14} className="mt-0.5 shrink-0" />
          <span>
            Protótipo · alterações não persistem entre navegações. Em produção,
            mudanças em CPF e data de nascimento exigirão verificação adicional
            (LGPD / vínculo com histórico clínico).
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/p/perfil"
            className={buttonVariants({ variant: 'outline', size: 'lg' })}
          >
            Cancelar
          </Link>
          <Button type="submit" size="lg">
            Salvar alterações
          </Button>
        </div>
      </form>
    </>
  );
}
