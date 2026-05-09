"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Search, X } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AgendamentoStatusBadge,
  PaymentStatusBadge,
} from "@/components/financial/status-badge";
import { PageHeader } from "@/components/layouts/page-header";
import {
  apiListAtendimentos,
  type AtendimentoListItem,
} from "@/lib/api/atendimentos";
import type { StatusAgendamento, StatusPagamento } from "@/lib/api/agendamentos";
import { apiErrorMessage } from "@/lib/api-client";
import { formatBRL, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/lib/current-user";
import { usePagination } from "@/lib/use-pagination";

const STATUS_OPCOES: { value: StatusAgendamento; label: string }[] = [
  { value: "agendado", label: "Agendado" },
  { value: "em_atendimento", label: "Em atendimento" },
  { value: "realizado", label: "Realizado" },
  { value: "cancelado", label: "Cancelado" },
  { value: "nao_compareceu", label: "Não compareceu" },
];

const PAGAMENTO_OPCOES: { value: StatusPagamento; label: string }[] = [
  { value: "pendente", label: "Pendente" },
  { value: "pago", label: "Pago" },
  { value: "gratuito", label: "Gratuito" },
];

type PeriodoPreset = "todos" | "hoje" | "semana" | "mes" | "30d";

const PERIODO_OPCOES: { value: PeriodoPreset; label: string }[] = [
  { value: "todos", label: "Todos os períodos" },
  { value: "hoje", label: "Hoje" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mês" },
  { value: "30d", label: "Últimos 30 dias" },
];

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function rangeDoPreset(preset: PeriodoPreset): {
  inicio: string;
  fim: string;
} | null {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (preset === "todos") return null;
  if (preset === "hoje") return { inicio: isoDate(hoje), fim: isoDate(hoje) };
  if (preset === "semana") {
    const dow = hoje.getDay();
    const segunda = new Date(hoje);
    segunda.setDate(hoje.getDate() + (dow === 0 ? -6 : 1 - dow));
    const domingo = new Date(segunda);
    domingo.setDate(segunda.getDate() + 6);
    return { inicio: isoDate(segunda), fim: isoDate(domingo) };
  }
  if (preset === "mes") {
    const ini = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    return { inicio: isoDate(ini), fim: isoDate(fim) };
  }
  // 30d
  const inicio = new Date(hoje);
  inicio.setDate(hoje.getDate() - 29);
  return { inicio: isoDate(inicio), fim: isoDate(hoje) };
}

export default function AtendimentosPage() {
  const router = useRouter();
  const { role } = useCurrentUser();
  const isProfissional = role === "profissional";
  const [atendimentos, setAtendimentos] = useState<AtendimentoListItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [busca, setBusca] = useState("");
  const [statusAtivos, setStatusAtivos] = useState<Set<StatusAgendamento>>(
    () => new Set(STATUS_OPCOES.map((o) => o.value)),
  );
  const [pagamentoAtivos, setPagamentoAtivos] = useState<Set<StatusPagamento>>(
    () => new Set(PAGAMENTO_OPCOES.map((o) => o.value)),
  );
  const [periodo, setPeriodo] = useState<PeriodoPreset>("todos");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { atendimentos } = await apiListAtendimentos();
      setAtendimentos(atendimentos);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  function toggleStatus(s: StatusAgendamento) {
    setStatusAtivos((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function togglePagamento(s: StatusPagamento) {
    setPagamentoAtivos((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function limparFiltros() {
    setBusca("");
    setStatusAtivos(new Set(STATUS_OPCOES.map((o) => o.value)));
    setPagamentoAtivos(new Set(PAGAMENTO_OPCOES.map((o) => o.value)));
    setPeriodo("todos");
  }

  const filtrados = useMemo(() => {
    const range = rangeDoPreset(periodo);
    const q = busca.trim().toLowerCase();
    return atendimentos.filter((a) => {
      if (!statusAtivos.has(a.status)) return false;
      if (!pagamentoAtivos.has(a.statusPagamento)) return false;
      if (range) {
        const dataIso = a.data.slice(0, 10);
        if (dataIso < range.inicio || dataIso > range.fim) return false;
      }
      if (q) {
        const haystack = [
          a.paciente.nome,
          a.paciente.telefone,
          a.profissional.nome,
          a.profissional.especialidade,
          a.consultorio.nome,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [atendimentos, statusAtivos, pagamentoAtivos, periodo, busca]);

  const { page, totalPages, setPage, slice } = usePagination(filtrados.length);
  const visiveis = slice(filtrados);

  // Reset pra página 1 sempre que os filtros mudam — evita ficar
  // "preso" numa página que sumiu após filtrar.
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busca, periodo, statusAtivos, pagamentoAtivos]);

  const totalStatus = STATUS_OPCOES.length;
  const totalPagamento = PAGAMENTO_OPCOES.length;
  const filtrosAtivos =
    busca.length > 0 ||
    periodo !== "todos" ||
    statusAtivos.size !== totalStatus ||
    pagamentoAtivos.size !== totalPagamento;

  return (
    <>
      <PageHeader
        title={isProfissional ? "Meus atendimentos" : "Atendimentos"}
        description={
          isProfissional
            ? "Consultas realizadas por você"
            : "Registro de consultas na clínica"
        }
        actions={
          (role === "admin" || role === "auxiliar" || isProfissional) && (
            <Link href="/atendimentos/novo" className={buttonVariants()}>
              <Plus size={16} />
              Registrar atendimento
            </Link>
          )
        }
      />

      <Card className="mb-4">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Buscar por paciente, profissional, telefone…"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-9"
                aria-label="Buscar atendimentos"
              />
            </div>
            <Select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoPreset)}
              aria-label="Filtrar por período"
              className="sm:w-56"
            >
              {PERIODO_OPCOES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Status:
            </span>
            {STATUS_OPCOES.map((opt) => {
              const ativo = statusAtivos.has(opt.value);
              return (
                <FilterChip
                  key={opt.value}
                  active={ativo}
                  onClick={() => toggleStatus(opt.value)}
                  label={opt.label}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              Pagamento:
            </span>
            {PAGAMENTO_OPCOES.map((opt) => {
              const ativo = pagamentoAtivos.has(opt.value);
              return (
                <FilterChip
                  key={opt.value}
                  active={ativo}
                  onClick={() => togglePagamento(opt.value)}
                  label={opt.label}
                />
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <span>
              Mostrando{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {filtrados.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {atendimentos.length}
              </span>{" "}
              atendimentos
            </span>
            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <X size={12} />
                Limpar filtros
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  {!isProfissional && <TableHead>Profissional</TableHead>}
                  <TableHead>Consultório</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="mt-1 h-3 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-1 h-3 w-28" />
                    </TableCell>
                    {!isProfissional && (
                      <TableCell>
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="mt-1 h-3 w-24" />
                      </TableCell>
                    )}
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : atendimentos.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum atendimento registrado ainda.
            </p>
          ) : filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum atendimento bate com os filtros atuais.
              </p>
              <button
                type="button"
                onClick={limparFiltros}
                className="text-xs font-medium text-primary hover:underline"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Paciente</TableHead>
                  {!isProfissional && <TableHead>Profissional</TableHead>}
                  <TableHead>Consultório</TableHead>
                  <TableHead className="text-right">Bruto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pagamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visiveis.map((a) => (
                  <TableRow
                    key={a.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Ver atendimento de ${a.paciente.nome}`}
                    onClick={() => router.push(`/atendimentos/${a.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        router.push(`/atendimentos/${a.id}`);
                      }
                    }}
                    className="cursor-pointer transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <TableCell className="whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {formatDate(a.data, "dd/MM")}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        {a.hora}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">{a.paciente.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.paciente.telefone}
                      </p>
                    </TableCell>
                    {!isProfissional && (
                      <TableCell>
                        <p className="text-sm font-medium">
                          {a.profissional.nome}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {a.profissional.especialidade}
                        </p>
                      </TableCell>
                    )}
                    <TableCell>
                      <p className="text-sm">{a.consultorio.nome}</p>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {formatBRL(Number(a.valorConsulta))}
                    </TableCell>
                    <TableCell>
                      <AgendamentoStatusBadge status={a.status} />
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={a.statusPagamento} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filtrados.length > 0 && (
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary hover:bg-primary/15"
          : "border-border bg-card text-muted-foreground line-through hover:bg-muted",
      )}
    >
      {label}
    </button>
  );
}
