'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronDown, Send, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RepasseStatusBadge } from '@/components/financial/status-badge';
import { PageHeader } from '@/components/layouts/page-header';
import { apiListRepasses, apiMarcarRepassePago, type RepasseListItem } from '@/lib/api/repasses';
import { apiListProfissionais, type Profissional } from '@/lib/api/profissionais';
import { apiErrorMessage } from '@/lib/api-client';
import { formatBRL, formatDate, formatPercent } from '@/lib/format';
import { useCurrentUser } from '@/lib/current-user';

const SEMANAS_INICIAIS = 4;
const SEMANAS_INCREMENTO = 3;

function initials(name: string) {
  const parts = name.split(' ').filter((p) => !['Dr.', 'Dra.'].includes(p));
  return (parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '');
}

function hojeISO(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function semanaAtualISO(): { inicio: string; fim: string } {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const dow = hoje.getDay();
  const segunda = new Date(hoje);
  segunda.setDate(hoje.getDate() + (dow === 0 ? -6 : 1 - dow));
  const domingo = new Date(segunda);
  domingo.setDate(segunda.getDate() + 6);
  const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { inicio: fmt(segunda), fim: fmt(domingo) };
}

function isAtrasado(r: RepasseListItem, hoje: string): boolean {
  return r.status === 'aberto' && r.periodoFim < hoje;
}

export default function RepassesPage() {
  const { role } = useCurrentUser();
  const podeGerenciar = role === 'admin' || role === 'auxiliar';

  const [repasses, setRepasses] = useState<RepasseListItem[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingPayId, setPendingPayId] = useState<string | null>(null);
  const [limite, setLimite] = useState(SEMANAS_INICIAIS);

  const semanaAtual = useMemo(() => semanaAtualISO(), []);
  const hoje = hojeISO();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rep, profs] = await Promise.all([apiListRepasses(), podeGerenciar ? apiListProfissionais({ ativo: true }) : Promise.resolve({ profissionais: [] as Profissional[] })]);
      setRepasses(rep.repasses);
      setProfissionais(profs.profissionais);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [podeGerenciar]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  async function confirmarPagamento(id: string) {
    try {
      // Atualiza só o repasse afetado em memória — evita re-fetchar tudo
      // (que causava o "flicker" de página recarregando).
      const { repasse } = await apiMarcarRepassePago(id);
      setRepasses((prev) => prev.map((r) => (r.id === id ? repasse : r)));
      toast.success('Repasse marcado como pago', {
        description: 'Registro gravado na auditoria.',
      });
      setPendingPayId(null);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  }

  const repasseEmConfirmacao = pendingPayId ? repasses.find((r) => r.id === pendingPayId) : null;

  // Agrupa por (periodoInicio, periodoFim) e ordena descendente
  const todosGrupos = useMemo(() => {
    const map = new Map<string, RepasseListItem[]>();
    for (const r of repasses) {
      const inicio = r.periodoInicio.slice(0, 10);
      const fim = r.periodoFim.slice(0, 10);
      const key = `${inicio}|${fim}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, list]) => {
        const [inicio, fim] = key.split('|');
        const temAtrasado = list.some((r) => isAtrasado(r, hoje));
        return { inicio, fim, list, temAtrasado };
      });
  }, [repasses, hoje]);

  // Mostra: todos os com atrasados + as `limite` semanas mais recentes
  const grupos = useMemo(() => {
    const visiveis: typeof todosGrupos = [];
    let semanasContadas = 0;
    for (const g of todosGrupos) {
      if (g.temAtrasado || semanasContadas < limite) {
        visiveis.push(g);
        semanasContadas += 1;
      }
    }
    return visiveis;
  }, [todosGrupos, limite]);

  const semanasOcultas = todosGrupos.length - grupos.length;

  const atrasados = repasses.filter((r) => isAtrasado(r, hoje));
  const abertosNoPrazo = repasses.filter((r) => r.status === 'aberto' && !isAtrasado(r, hoje));
  const totalAtrasado = atrasados.reduce((s, r) => s + Number(r.valorRepasse), 0);
  const totalAbertosNoPrazo = abertosNoPrazo.reduce((s, r) => s + Number(r.valorRepasse), 0);
  const repassesSemanaAtual = repasses.filter((r) => r.periodoInicio.slice(0, 10) === semanaAtual.inicio);
  const totalRepasseSemana = repassesSemanaAtual.reduce((s, r) => s + Number(r.valorRepasse), 0);
  const totalBrutoSemana = repassesSemanaAtual.reduce((s, r) => s + Number(r.receitaBruta), 0);

  return (
    <>
      <PageHeader title="Repasses" description="Prestação de contas semanal aos profissionais" />

      {podeGerenciar && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4 text-sm">
          <CalendarClock size={16} className="mt-0.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="font-medium text-foreground">Geração automática toda segunda-feira</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Os repasses são calculados pelo servidor a cada segunda às 00:00 cobrindo a semana anterior (segunda → domingo). Esta tela apenas exibe e marca como pago.</p>
          </div>
        </div>
      )}

      {atrasados.length > 0 && (
        <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">{atrasados.length} repasses atrasados de semanas anteriores</p>
              <p className="text-xs text-muted-foreground">
                Total atrasado: <span className="font-medium text-foreground tabular-nums">{formatBRL(totalAtrasado)}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Atrasados</p>
          <p className={`mt-1 text-2xl font-bold tabular-nums ${atrasados.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{formatBRL(totalAtrasado)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{atrasados.length} repasses</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Em aberto (no prazo)</p>
          <p className="mt-1 text-2xl font-bold text-warning tabular-nums">{formatBRL(totalAbertosNoPrazo)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{abertosNoPrazo.length} repasses</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Total repasses · semana atual</p>
          <p className="mt-1 text-2xl font-bold text-primary tabular-nums">{formatBRL(totalRepasseSemana)}</p>
          <p className="mt-1 text-xs text-muted-foreground">sobre {formatBRL(totalBrutoSemana)} bruto</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-muted-foreground">Margem · semana atual</p>
          <p className="mt-1 text-2xl font-bold text-success tabular-nums">{formatBRL(totalBrutoSemana - totalRepasseSemana)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Receita que fica com a clínica</p>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-6" aria-hidden="true">
          {Array.from({ length: 2 }).map((_, g) => (
            <Card key={g}>
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-5 w-28 rounded-full" />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead className="text-right">Atendimentos</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Repasse</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Skeleton className="size-9 rounded-full" />
                            <div className="space-y-1.5">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-24" />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-28" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-4 w-8" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-4 w-20" />
                        </TableCell>
                        <TableCell className="text-right">
                          <Skeleton className="ml-auto h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-5 w-20 rounded-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-20" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : grupos.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">Nenhum repasse fechado ainda. O próximo cálculo acontece na próxima segunda-feira, cobrindo a semana atual.</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grupos.map((g) => {
            const ehSemanaAtual = g.inicio === semanaAtual.inicio;
            const abertosGrupo = g.list.filter((r) => r.status === 'aberto');
            const pagosGrupo = g.list.filter((r) => r.status === 'pago');
            const atrasadosGrupo = g.list.filter((r) => isAtrasado(r, hoje));

            return (
              <Card key={`${g.inicio}-${g.fim}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">
                      Semana de {formatDate(g.inicio, 'dd/MM')} a {formatDate(g.fim, 'dd/MM')}
                      {ehSemanaAtual && (
                        <Badge variant="info" className="ml-2 align-middle">
                          Semana atual
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {atrasadosGrupo.length > 0 && <span className="font-medium text-destructive">{atrasadosGrupo.length} atrasados · </span>}
                      {abertosGrupo.length - atrasadosGrupo.length > 0 && <>{abertosGrupo.length - atrasadosGrupo.length} em aberto · </>}
                      {pagosGrupo.length} pagos
                    </p>
                  </div>
                  {abertosGrupo.length === 0 && <Badge variant="success">Semana fechada</Badge>}
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Profissional</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead className="text-right">Atendimentos</TableHead>
                        <TableHead className="text-right">Bruto</TableHead>
                        <TableHead className="text-right">Repasse</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-32" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {g.list.map((r) => {
                        const atrasado = isAtrasado(r, hoje);
                        const prof = r.profissional;
                        const profCompleto = profissionais.find((p) => p.id === prof.id);
                        return (
                          <TableRow key={r.id} className={atrasado ? 'bg-destructive/5' : undefined}>
                            <TableCell>
                              <Link href={`/financeiro/repasses/${r.id}`} className="block hover:text-primary">
                                <div className="flex items-center gap-3">
                                  <Avatar className="size-9 bg-primary/10 text-primary">
                                    <AvatarFallback>{initials(prof.nome)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-medium">{prof.nome}</p>
                                    <p className="text-xs text-muted-foreground">{prof.especialidade}</p>
                                  </div>
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              {prof.modalidadeContrato === 'percentual' ? (
                                <span className="text-sm">{formatPercent(Number(profCompleto?.percentualRepasse ?? 0))} sobre bruto</span>
                              ) : (
                                <span className="text-sm">{formatBRL(Number(profCompleto?.valorAluguelPorTurno ?? 0))} por turno</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">{r.atendimentos.length}</TableCell>
                            <TableCell className="text-right tabular-nums">{formatBRL(Number(r.receitaBruta))}</TableCell>
                            <TableCell className="text-right font-semibold tabular-nums">{formatBRL(Number(r.valorRepasse))}</TableCell>
                            <TableCell>
                              <div className="flex flex-col items-start">
                                <RepasseStatusBadge status={r.status} atrasado={atrasado} />
                                {r.dataPagamento && <span className="mt-1 text-xs text-muted-foreground">{formatDate(r.dataPagamento, 'dd/MM/yyyy')}</span>}
                              </div>
                            </TableCell>
                            <TableCell>
                              {r.status === 'aberto' && podeGerenciar ? (
                                <Button size="sm" variant={atrasado ? 'destructive' : 'outline'} onClick={() => setPendingPayId(r.id)}>
                                  <Send size={14} />
                                  Pagar
                                </Button>
                              ) : r.status === 'pago' ? (
                                <span className="flex items-center gap-1 text-xs text-success">
                                  <CheckCircle2 size={14} /> Pago
                                </span>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}

          {semanasOcultas > 0 && (
            <div className="flex justify-center pt-2">
              <Button type="button" variant="outline" onClick={() => setLimite((l) => l + SEMANAS_INCREMENTO)}>
                <ChevronDown size={14} />
                Carregar semanas anteriores ({semanasOcultas} restantes)
              </Button>
            </div>
          )}
        </div>
      )}

      {repasseEmConfirmacao && <ConfirmarPagamentoDialog repasse={repasseEmConfirmacao} atrasado={isAtrasado(repasseEmConfirmacao, hoje)} onClose={() => setPendingPayId(null)} onConfirm={() => confirmarPagamento(repasseEmConfirmacao.id)} />}
    </>
  );
}

function ConfirmarPagamentoDialog({ repasse, atrasado, onClose, onConfirm }: { repasse: RepasseListItem; atrasado: boolean; onClose: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" aria-label="Fechar" onClick={onClose} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Confirmar pagamento</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Esta ação fica registrada na auditoria e não pode ser desfeita.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <div className="flex items-center gap-3">
            <Avatar className="size-9 bg-primary/10 text-primary">
              <AvatarFallback>{initials(repasse.profissional.nome)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-medium">{repasse.profissional.nome}</p>
              <p className="text-xs text-muted-foreground">{repasse.profissional.especialidade}</p>
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período</span>
              <span className="tabular-nums">
                {formatDate(repasse.periodoInicio, 'dd/MM')} – {formatDate(repasse.periodoFim, 'dd/MM')}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-muted-foreground">Receita bruta</span>
              <span className="tabular-nums">{formatBRL(Number(repasse.receitaBruta))}</span>
            </div>
            <div className="mt-1 flex justify-between text-base font-semibold">
              <span>Valor a pagar</span>
              <span className="tabular-nums">{formatBRL(Number(repasse.valorRepasse))}</span>
            </div>
          </div>
          {atrasado && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              <AlertTriangle size={12} className="mt-0.5 shrink-0" />
              <span>Este repasse está atrasado — período encerrou em {formatDate(repasse.periodoFim, 'dd/MM/yyyy')}.</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" variant={atrasado ? 'destructive' : 'default'} className="flex-1" onClick={onConfirm}>
            <CheckCircle2 size={14} />
            Confirmar pagamento
          </Button>
        </div>
      </div>
    </div>
  );
}
