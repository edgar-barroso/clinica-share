'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/layouts/page-header';
import { apiListConsultorios, type Consultorio } from '@/lib/api/consultorios';
import { apiGetProfissional, apiUpdateProfissional, apiAddTurnoFixo, apiRemoveTurnoFixo, type ModalidadeContrato, type Turno, type TurnoFixo } from '@/lib/api/profissionais';
import { apiGetTurnos, type TurnosConfig } from '@/lib/api/configuracoes';
import { apiErrorMessage } from '@/lib/api-client';
import { formatBRL, formatPercent } from '@/lib/format';

const TURNOS_FALLBACK: TurnosConfig = {
  manha: { inicio: '07:00', fim: '12:00' },
  tarde: { inicio: '13:00', fim: '18:00' },
  noite: { inicio: '18:00', fim: '20:00' },
};

function turnosOptions(cfg: TurnosConfig): { value: Turno; label: string }[] {
  return [
    { value: 'manha', label: `Manhã (${cfg.manha.inicio}-${cfg.manha.fim})` },
    { value: 'tarde', label: `Tarde (${cfg.tarde.inicio}-${cfg.tarde.fim})` },
    { value: 'noite', label: `Noite (${cfg.noite.inicio}-${cfg.noite.fim})` },
  ];
}

const DIAS_SEMANA = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
];

export default function EditarProfissionalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [consultorios, setConsultorios] = useState<Consultorio[]>([]);

  const [nome, setNome] = useState('');
  const [especialidade, setEspecialidade] = useState('');
  const [conselho, setConselho] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [duracao, setDuracao] = useState('30');
  const [valorConsultaBase, setValorConsultaBase] = useState('0');
  const [ativo, setAtivo] = useState(true);
  const [modalidade, setModalidade] = useState<ModalidadeContrato>('percentual');
  const [percentual, setPercentual] = useState('30');
  const [aluguel, setAluguel] = useState('0');
  const [motivo, setMotivo] = useState('');

  const [turnos, setTurnos] = useState<TurnoFixo[]>([]);
  const [novoTurnoDia, setNovoTurnoDia] = useState(1);
  const [novoTurnoTurno, setNovoTurnoTurno] = useState<Turno>('manha');
  const [novoTurnoConsultorioId, setNovoTurnoConsultorioId] = useState('');
  // Config de turnos (manhã/tarde/noite) — labels do select refletem
  // o que o admin definiu em /configuracoes/turnos.
  const [turnosConfig, setTurnosConfig] = useState<TurnosConfig>(TURNOS_FALLBACK);
  const TURNOS = useMemo(() => turnosOptions(turnosConfig), [turnosConfig]);

  // snapshot original para detectar diff em contrato
  const [originalContract, setOriginalContract] = useState<{
    modalidade: ModalidadeContrato;
    percentualRepasse: number | null;
    valorAluguelPorTurno: number | null;
    valorConsultaBase: number;
  } | null>(null);

  useEffect(() => {
    apiGetTurnos()
      .then((res) => setTurnosConfig(res.turnos))
      .catch(() => {
        // mantém TURNOS_FALLBACK
      });
    Promise.all([apiGetProfissional(id), apiListConsultorios({ ativo: true })])
      .then(([profRes, consRes]) => {
        const p = profRes.profissional;
        setNome(p.nome);
        setEspecialidade(p.especialidade);
        setConselho(p.conselho);
        setEmail(p.email);
        setTelefone(p.telefone);
        setDuracao(String(p.duracaoConsultaMinutos));
        setAtivo(p.ativo);
        setModalidade(p.modalidadeContrato);
        const pct = p.percentualRepasse ? Number(p.percentualRepasse) : 0;
        setPercentual(String(Math.round(pct * 100)));
        setAluguel(String(p.valorAluguelPorTurno ?? 0));
        const base = Number(p.valorConsultaBase);
        setValorConsultaBase(String(base));
        setTurnos(p.turnosFixos ?? []);
        setOriginalContract({
          modalidade: p.modalidadeContrato,
          percentualRepasse: pct || null,
          valorAluguelPorTurno: p.valorAluguelPorTurno ? Number(p.valorAluguelPorTurno) : null,
          valorConsultaBase: base,
        });

        setConsultorios(consRes.consultorios);
        if (consRes.consultorios[0]) setNovoTurnoConsultorioId(consRes.consultorios[0].id);
      })
      .catch((err) => {
        if ((err as { status?: number })?.status === 404) setNotFound(true);
        else toast.error(apiErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const novoPercentual = Number(percentual) / 100;
  const novoAluguel = Number(aluguel);
  const novoValorBase = Number(valorConsultaBase);
  const contratoMudou =
    originalContract !== null &&
    (modalidade !== originalContract.modalidade ||
      (modalidade === 'percentual' && novoPercentual !== originalContract.percentualRepasse) ||
      (modalidade === 'aluguel_fixo' && novoAluguel !== originalContract.valorAluguelPorTurno) ||
      novoValorBase !== originalContract.valorConsultaBase);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (contratoMudou && motivo.trim().length < 3) {
      toast.warning('Alteração de contrato exige motivo (mínimo 3 caracteres)');
      return;
    }
    setSubmitting(true);
    try {
      await apiUpdateProfissional(id, {
        nome,
        especialidade,
        conselho,
        email,
        telefone,
        duracaoConsultaMinutos: Number(duracao),
        ativo,
        modalidadeContrato: modalidade,
        percentualRepasse: modalidade === 'percentual' ? novoPercentual : null,
        valorAluguelPorTurno: modalidade === 'aluguel_fixo' ? novoAluguel : null,
        valorConsultaBase: novoValorBase,
        ...(contratoMudou ? { motivo } : {}),
      });
      toast.success('Alterações salvas');
      router.push(`/profissionais/${id}`);
      router.refresh();
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setSubmitting(false);
    }
  }

  async function adicionarTurno() {
    if (!novoTurnoConsultorioId) {
      toast.warning('Selecione um consultório');
      return;
    }
    try {
      const { turno } = await apiAddTurnoFixo(id, {
        consultorioId: novoTurnoConsultorioId,
        diaSemana: novoTurnoDia,
        turno: novoTurnoTurno,
      });
      setTurnos((arr) => [...arr, turno]);
      toast.success('Turno adicionado');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  async function removerTurno(turnoId: string) {
    try {
      await apiRemoveTurnoFixo(id, turnoId);
      setTurnos((arr) => arr.filter((t) => t.id !== turnoId));
      toast.success('Turno removido');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  if (loading) {
    return (
      <div aria-hidden="true">
        <Skeleton className="mb-4 h-4 w-24" />
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
          <aside className="lg:col-span-1">
            <Skeleton className="h-56 rounded-2xl" />
          </aside>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm text-muted-foreground">Profissional não encontrado.</p>
        <Link href="/profissionais" className={`${buttonVariants({ variant: 'outline' })} mt-4 inline-flex`}>
          <ArrowLeft size={14} />
          Voltar
        </Link>
      </Card>
    );
  }

  return (
    <>
      <Link href={`/profissionais/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft size={14} />
        Voltar
      </Link>

      <PageHeader
        title={`Editar ${nome}`}
        description="Atualize dados, contrato e turnos do profissional"
        actions={
          <Link href={`/profissionais/${id}`} className={buttonVariants({ variant: 'outline' })}>
            Cancelar
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais e profissionais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="nome">Nome completo</Label>
                <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Select id="especialidade" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}>
                  <option>Clínica geral</option>
                  <option>Cardiologia</option>
                  <option>Dermatologia</option>
                  <option>Fisioterapia</option>
                  <option>Ginecologia</option>
                  <option>Nutrição</option>
                  <option>Oftalmologia</option>
                  <option>Pediatria</option>
                  <option>Psicologia</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conselho">Conselho profissional</Label>
                <Input id="conselho" value={conselho} onChange={(e) => setConselho(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="duracao">Duração da consulta</Label>
                <Input id="duracao" type="number" min="10" step="5" value={duracao} onChange={(e) => setDuracao(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorBase">Valor base da consulta (R$)</Label>
                <Input id="valorBase" type="number" min="0" step="0.01" value={valorConsultaBase} onChange={(e) => setValorConsultaBase(e.target.value)} required />
                <p className="text-xs text-muted-foreground">Mudar este valor exige motivo (auditoria).</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Status</Label>
                <Select id="status" value={ativo ? 'ativo' : 'inativo'} onChange={(e) => setAtivo(e.target.value === 'ativo')}>
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contrato e repasse</CardTitle>
              <CardDescription>Alteração em contrato exige motivo e gera registro de auditoria.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setModalidade('percentual')} className={`rounded-xl border p-4 text-left transition-colors ${modalidade === 'percentual' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted'}`}>
                  <p className="text-sm font-semibold">Percentual</p>
                  <p className="mt-1 text-xs text-muted-foreground">Clínica recebe % sobre atendimentos</p>
                </button>
                <button
                  type="button"
                  onClick={() => setModalidade('aluguel_fixo')}
                  className={`rounded-xl border p-4 text-left transition-colors ${modalidade === 'aluguel_fixo' ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted'}`}
                >
                  <p className="text-sm font-semibold">Aluguel fixo</p>
                  <p className="mt-1 text-xs text-muted-foreground">Valor fixo por turno utilizado</p>
                </button>
              </div>

              {modalidade === 'percentual' ? (
                <div className="space-y-1.5">
                  <Label htmlFor="perc">Percentual (%)</Label>
                  <Input id="perc" type="number" min="0" max="100" step="0.5" value={percentual} onChange={(e) => setPercentual(e.target.value)} />
                  <p className="text-xs text-muted-foreground">Equivale a {formatPercent(novoPercentual || 0)} sobre receita bruta.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="aluguel">Aluguel por turno (R$)</Label>
                  <Input id="aluguel" type="number" min="0" step="0.01" value={aluguel} onChange={(e) => setAluguel(e.target.value)} />
                  <p className="text-xs text-muted-foreground">{formatBRL(novoAluguel || 0)} a cada turno ocupado.</p>
                </div>
              )}

              {contratoMudou && (
                <div className="space-y-1.5 border-t border-border pt-4">
                  <Label htmlFor="motivo">Motivo da alteração *</Label>
                  <Input id="motivo" placeholder="Ex: Renegociação anual" value={motivo} onChange={(e) => setMotivo(e.target.value)} required />
                  <p className="text-xs text-muted-foreground">Obrigatório quando modalidade ou valor de contrato mudam.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Turnos fixos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {turnos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem turnos configurados.</p>
              ) : (
                <ul className="space-y-2">
                  {turnos.map((t) => (
                    <li key={t.id} className="flex items-center justify-between rounded-xl bg-muted/50 p-3 text-sm">
                      <div>
                        <p className="font-medium">
                          {DIAS_SEMANA[t.diaSemana - 1]?.label} · {TURNOS.find((x) => x.value === t.turno)?.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{t.consultorio.nome}</p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removerTurno(t.id)} aria-label="Remover turno">
                        <Trash2 size={14} />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-12 gap-2 rounded-xl border border-dashed border-border p-3">
                <Select className="col-span-3" value={novoTurnoDia} onChange={(e) => setNovoTurnoDia(Number(e.target.value))}>
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
                <Select className="col-span-3" value={novoTurnoTurno} onChange={(e) => setNovoTurnoTurno(e.target.value as Turno)}>
                  {TURNOS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
                <Select className="col-span-4" value={novoTurnoConsultorioId} onChange={(e) => setNovoTurnoConsultorioId(e.target.value)}>
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </Select>
                <Button type="button" variant="outline" className="col-span-2" onClick={adicionarTurno}>
                  <Plus size={14} />
                  Add
                </Button>
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
              <div className="space-y-1.5 rounded-xl bg-muted/50 p-3 text-xs">
                <p>
                  <span className="text-muted-foreground">Contrato:</span> <span className="font-medium">{modalidade === 'percentual' ? `% ${percentual}` : `Aluguel ${formatBRL(novoAluguel || 0)}`}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Turnos:</span> <span className="font-medium">{turnos.length}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Status:</span> <span className="font-medium">{ativo ? 'Ativo' : 'Inativo'}</span>
                </p>
                {contratoMudou && <p className="text-warning">⚠ Contrato mudou — motivo obrigatório</p>}
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Salvar alterações'}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </form>
    </>
  );
}
