"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate, formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const DOW_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export interface MonthlyCalendarProps {
  /** Data atualmente selecionada no formato YYYY-MM-DD. */
  value: string | null;
  /** Callback ao selecionar uma data válida. */
  onChange: (iso: string) => void;
  /**
   * Conjunto de DOWs (0=Dom..6=Sáb) em que o profissional atende. Quando
   * fornecido, dias fora do conjunto ficam visualmente apagados e
   * desabilitados. Quando `undefined`, nenhum filtro de DOW é aplicado.
   */
  diasUteisAtende?: Set<number>;
  /** Datas (ISO YYYY-MM-DD) totalmente lotadas — desabilitadas + riscadas. */
  diasLotados?: Set<string>;
  /** Permite escolher datas passadas. Default: false. */
  allowPast?: boolean;
  /** Permite escolher datas futuras. Default: true. */
  allowFuture?: boolean;
  /** Quantos meses à frente do atual permitir. Default: 3. */
  monthsAhead?: number;
  /** Quantos meses para trás permitir (apenas se allowPast). Default: 3. */
  monthsBack?: number;
  /** Permite escolher fim de semana. Default: false (clínica fecha sáb/dom). */
  allowWeekend?: boolean;
  /**
   * Notifica o pai quando o usuário navega entre meses. Útil pra
   * pré-carregar lotados/disponibilidades sob demanda.
   */
  onVisibleMonthChange?: (mes: Date) => void;
}

/**
 * Calendário mensal com filtros de DOW, datas passadas/futuras e
 * dias lotados. Compartilhado por /p/agendar, /agenda/novo e
 * /atendimentos/novo.
 */
export function MonthlyCalendar({
  value,
  onChange,
  diasUteisAtende,
  diasLotados,
  allowPast = false,
  allowFuture = true,
  monthsAhead = 3,
  monthsBack = 3,
  allowWeekend = false,
  onVisibleMonthChange,
}: MonthlyCalendarProps) {
  const hojeRef = useMemo(() => {
    const h = new Date();
    h.setHours(0, 0, 0, 0);
    return h;
  }, []);

  const mesMinimo = useMemo(() => {
    const back = allowPast ? monthsBack : 0;
    return new Date(hojeRef.getFullYear(), hojeRef.getMonth() - back, 1);
  }, [hojeRef, allowPast, monthsBack]);

  const mesMaximo = useMemo(() => {
    const ahead = allowFuture ? monthsAhead : 0;
    return new Date(hojeRef.getFullYear(), hojeRef.getMonth() + ahead, 1);
  }, [hojeRef, allowFuture, monthsAhead]);

  const [mesVisivel, setMesVisivel] = useState<Date>(() => {
    const inicial = value
      ? new Date(`${value}T12:00:00`)
      : hojeRef;
    return new Date(inicial.getFullYear(), inicial.getMonth(), 1);
  });

  // Se a data selecionada mudar via prop pra um mês fora do visível
  // (ex: reset externo), navega o calendário pra ela.
  useEffect(() => {
    if (!value) return;
    const dt = new Date(`${value}T12:00:00`);
    if (
      dt.getFullYear() !== mesVisivel.getFullYear() ||
      dt.getMonth() !== mesVisivel.getMonth()
    ) {
      setMesVisivel(new Date(dt.getFullYear(), dt.getMonth(), 1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Avisa o pai quando o mês muda (incluindo no mount).
  useEffect(() => {
    onVisibleMonthChange?.(mesVisivel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesVisivel]);

  const podeVoltar = mesVisivel.getTime() > mesMinimo.getTime();
  const podeAvancar = mesVisivel.getTime() < mesMaximo.getTime();

  // Grade do mês: array com Date|null. Preenche posições antes do dia 1
  // (alinha à coluna de domingo) e depois do último dia.
  const diasDoMes = useMemo(() => {
    const ano = mesVisivel.getFullYear();
    const mes = mesVisivel.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < primeiro.getDay(); i++) cells.push(null);
    for (let dia = 1; dia <= ultimoDia; dia++) {
      cells.push(new Date(ano, mes, dia));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [mesVisivel]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            podeVoltar &&
            setMesVisivel(
              new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() - 1, 1),
            )
          }
          disabled={!podeVoltar}
          aria-label="Mês anterior"
          className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-semibold capitalize">
          {formatDate(mesVisivel, "MMMM 'de' yyyy")}
        </p>
        <button
          type="button"
          onClick={() =>
            podeAvancar &&
            setMesVisivel(
              new Date(mesVisivel.getFullYear(), mesVisivel.getMonth() + 1, 1),
            )
          }
          disabled={!podeAvancar}
          aria-label="Próximo mês"
          className="flex size-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
        {DOW_LABELS.map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {diasDoMes.map((d, idx) => {
          if (!d) return <div key={`empty-${idx}`} />;
          const iso = isoDate(d);
          const active = value === iso;
          const dow = d.getDay();
          const isPast = d.getTime() < hojeRef.getTime();
          const isFuture = d.getTime() > hojeRef.getTime();
          const isFds = !allowWeekend && (dow === 0 || dow === 6);
          const isLotado = diasLotados?.has(iso) ?? false;
          const profNaoAtende = diasUteisAtende
            ? !diasUteisAtende.has(dow)
            : false;
          const tooFar = !allowFuture && isFuture;
          const tooBack = !allowPast && isPast;
          const disabled =
            tooFar || tooBack || isFds || isLotado || profNaoAtende;
          const aria = profNaoAtende
            ? `${formatDateLong(d)} — profissional não atende neste dia`
            : isLotado
              ? `${formatDateLong(d)} — sem horários disponíveis`
              : formatDateLong(d);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onChange(iso)}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl border text-sm font-medium tabular-nums transition-colors",
                tooFar || tooBack || isFds
                  ? "cursor-not-allowed border-transparent text-muted-foreground/40"
                  : profNaoAtende
                    ? "cursor-not-allowed border-transparent text-muted-foreground/30"
                    : isLotado
                      ? "cursor-not-allowed border-border bg-muted/60 text-muted-foreground line-through"
                      : active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-muted",
              )}
              aria-label={aria}
              title={
                profNaoAtende
                  ? "Profissional não atende"
                  : isLotado
                    ? "Sem horários disponíveis"
                    : undefined
              }
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
