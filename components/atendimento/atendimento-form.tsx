'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Info, ShieldAlert } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, Textarea } from '@/components/ui/select';
import { PaymentStatusBadge } from '@/components/financial/status-badge';
import { PacienteCombobox } from '@/components/paciente/paciente-combobox';
import { consultorios, getConsultorio, getPaciente, getProfissional, profissionais } from '@/lib/mock/data';
import { formatBRL, formatDateLong } from '@/lib/format';
import type { ProntuarioInterno, StatusPagamento } from '@/lib/mock/types';

export interface AtendimentoFormValues {
  data: string;
  hora: string;
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  valorConsulta: number;
  usaProntuarioExterno: boolean;
  prontuario?: ProntuarioInterno;
  statusPagamento: StatusPagamento;
  motivo: string;
}

interface Props {
  mode: 'create' | 'edit';
  initial?: Partial<AtendimentoFormValues>;
  callout?: { icon?: 'info'; title: string; description?: string };
  cancelHref: string;
  submitLabel?: string;
  /**
   * Quando true, paciente/profissional/consultório/data/hora ficam read-only.
   * Usado ao finalizar um agendamento existente (dados vêm do agendamento).
   */
  lockIdentity?: boolean;
  /**
   * Quando true, exibe os campos do prontuário interno (evolução, diagnóstico,
   * conduta) sempre que o profissional optar pelo prontuário do ClinicaShare.
   * Usado no fluxo de finalizar atendimento (AT06) e na edição pós-finalização.
   */
  enableProntuarioFields?: boolean;
  /**
   * Quando true, status de pagamento + motivo viram read-only. Usado quando o
   * profissional edita a própria consulta — pagamento é decisão de admin/auxiliar.
   */
  lockPayment?: boolean;
  onSubmit: (values: AtendimentoFormValues) => void;
}

function hojeISO() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function AtendimentoForm({ mode, initial, callout, cancelHref, submitLabel, lockIdentity = false, enableProntuarioFields = false, lockPayment = false, onSubmit }: Props) {
  const [data, setData] = useState(initial?.data ?? hojeISO());
  const [hora, setHora] = useState(initial?.hora ?? '09:00');
  const [pacienteId, setPacienteId] = useState(initial?.pacienteId ?? 'pt01');
  const [profissionalId, setProfissionalId] = useState(initial?.profissionalId ?? 'p01');
  const [consultorioId, setConsultorioId] = useState(initial?.consultorioId ?? 'c03');
  const [valorConsulta, setValorConsulta] = useState(String(initial?.valorConsulta ?? 280));
  const [usaProntuarioExterno, setUsaProntuarioExterno] = useState(initial?.usaProntuarioExterno ?? false);
  const [statusPagamento, setStatusPagamento] = useState<StatusPagamento>(initial?.statusPagamento ?? 'pendente');
  const [motivo, setMotivo] = useState(initial?.motivo ?? '');
  const [evolucao, setEvolucao] = useState(initial?.prontuario?.evolucao ?? '');
  const [diagnostico, setDiagnostico] = useState(initial?.prontuario?.diagnostico ?? '');
  const [conduta, setConduta] = useState(initial?.prontuario?.conduta ?? '');

  const exibirCamposProntuario = enableProntuarioFields && !usaProntuarioExterno;

  const total = Number(valorConsulta) || 0;

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    onSubmit({
      data,
      hora,
      pacienteId,
      profissionalId,
      consultorioId,
      valorConsulta: Number(valorConsulta) || 0,
      usaProntuarioExterno,
      prontuario: exibirCamposProntuario
        ? {
            evolucao: evolucao.trim(),
            diagnostico: diagnostico.trim(),
            conduta: conduta.trim(),
          }
        : undefined,
      statusPagamento,
      motivo,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {callout && (
          <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm">
            <Info size={16} className="mt-0.5 shrink-0 text-primary" />
            <div className="min-w-0">
              <p className="font-medium text-foreground">{callout.title}</p>
              {callout.description && <p className="mt-1 text-muted-foreground">{callout.description}</p>}
            </div>
          </div>
        )}

        {lockIdentity ? (
          <Card>
            <CardHeader>
              <CardTitle>Atendimento agendado</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <IdentityItem label="Paciente" value={getPaciente(pacienteId)?.nome ?? pacienteId} hint={getPaciente(pacienteId)?.telefone} />
              <IdentityItem label="Profissional" value={getProfissional(profissionalId)?.nome ?? profissionalId} hint={getProfissional(profissionalId)?.especialidade} />
              <IdentityItem label="Consultório" value={getConsultorio(consultorioId)?.nome ?? consultorioId} hint={getConsultorio(consultorioId)?.tipo} />
              <IdentityItem label="Data e horário" value={data ? formatDateLong(data) : '—'} hint={hora} />
              <div className="space-y-1.5">
                <Label htmlFor="valorConsulta">Valor cobrado (R$)</Label>
                <Input id="valorConsulta" type="number" min="0" step="0.01" value={valorConsulta} onChange={(e) => setValorConsulta(e.target.value)} required />
                <p className="text-xs text-muted-foreground">Ajuste se aplicou desconto na hora da consulta.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prontuarioExterno">Prontuário</Label>
                <Select id="prontuarioExterno" value={usaProntuarioExterno ? 'externo' : 'interno'} onChange={(e) => setUsaProntuarioExterno(e.target.value === 'externo')}>
                  <option value="interno">Prontuário do ClinicaShare</option>
                  <option value="externo">Profissional usa prontuário externo</option>
                </Select>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Dados do atendimento</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hora">Horário</Label>
                <Input id="hora" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="paciente">Paciente</Label>
                <PacienteCombobox id="paciente" value={pacienteId} onChange={setPacienteId} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profissional">Profissional</Label>
                <Select id="profissional" value={profissionalId} onChange={(e) => setProfissionalId(e.target.value)} required>
                  {profissionais.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nome} — {p.especialidade}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="consultorio">Consultório</Label>
                <Select id="consultorio" value={consultorioId} onChange={(e) => setConsultorioId(e.target.value)} required>
                  {consultorios.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome} — {c.tipo}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="valorConsulta">Valor da consulta (R$)</Label>
                <Input id="valorConsulta" type="number" min="0" step="0.01" value={valorConsulta} onChange={(e) => setValorConsulta(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="prontuarioExterno">Prontuário</Label>
                <Select id="prontuarioExterno" value={usaProntuarioExterno ? 'externo' : 'interno'} onChange={(e) => setUsaProntuarioExterno(e.target.value === 'externo')}>
                  <option value="interno">Prontuário do ClinicaShare</option>
                  <option value="externo">Profissional usa prontuário externo</option>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {exibirCamposProntuario && (
          <Card>
            <CardHeader>
              <CardTitle>Registro do prontuário</CardTitle>
              <CardDescription>Profissional optou pelo prontuário do ClinicaShare. Preencha a evolução clínica deste atendimento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="evolucao">Evolução clínica *</Label>
                <Textarea id="evolucao" value={evolucao} onChange={(e) => setEvolucao(e.target.value)} placeholder="Resumo do atendimento, queixa e achados relevantes." rows={4} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="diagnostico">Diagnóstico / hipótese *</Label>
                <Textarea id="diagnostico" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} placeholder="Hipóteses diagnósticas, CID quando aplicável." rows={3} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="conduta">Conduta / prescrição *</Label>
                <Textarea id="conduta" value={conduta} onChange={(e) => setConduta(e.target.value)} placeholder="Plano terapêutico, medicações, exames solicitados, retorno." rows={3} required />
              </div>
              <div className="flex items-start gap-2 rounded-xl border border-dashed border-warning/40 bg-warning/10 p-3 text-xs text-warning">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                <span>Protótipo · campos serão validados com Dr. Edson em R2 (PEND-035). Versão produtiva exigirá criptografia em repouso, controle de acesso por papel e audit log de toda leitura/escrita (LGPD).</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Pagamento</CardTitle>
            {lockPayment && <CardDescription>Status de pagamento é gerenciado pelo administrativo (FI11).</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">
            {lockPayment ? (
              <>
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                  <span className="text-sm text-muted-foreground">Status atual:</span>
                  <PaymentStatusBadge status={statusPagamento} />
                </div>
                {motivo && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Justificativa registrada</p>
                    <p className="mt-1 rounded-xl border border-dashed border-border bg-card p-3 text-sm">{motivo}</p>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  {(['pago', 'pendente', 'gratuito'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusPagamento(s)}
                      className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${statusPagamento === s ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-card text-foreground hover:bg-muted'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {(statusPagamento === 'gratuito' || statusPagamento === 'pendente') && (
                  <div className="space-y-1.5">
                    <Label htmlFor="motivo">{statusPagamento === 'gratuito' ? 'Justificativa da gratuidade (obrigatório)' : 'Observação sobre o pagamento (opcional)'}</Label>
                    <Textarea
                      id="motivo"
                      value={motivo}
                      onChange={(e) => setMotivo(e.target.value)}
                      placeholder={statusPagamento === 'gratuito' ? 'Ex: Cortesia para filho de funcionário' : 'Ex: Paciente vai pagar por Pix amanhã'}
                      required={statusPagamento === 'gratuito'}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <aside className="space-y-4 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-3 text-base">
              <span className="font-semibold">Valor da consulta</span>
              <span className="font-bold tabular-nums">{formatBRL(total)}</span>
            </div>
            <p className="pt-1 text-xs text-muted-foreground">O repasse será calculado no servidor após o fechamento semanal, com base no contrato do profissional.</p>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" className="w-full">
            {submitLabel ?? (mode === 'create' ? 'Registrar atendimento' : 'Salvar alterações')}
          </Button>
          <Link href={cancelHref} className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            Cancelar
          </Link>
        </div>
      </aside>
    </form>
  );
}

function IdentityItem({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
