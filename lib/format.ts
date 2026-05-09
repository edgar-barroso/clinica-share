import { format as dfFormat, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const brlFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

const compactFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatBRL(value: number): string {
  return brlFormatter.format(value);
}

export function formatPercent(value: number): string {
  return percentFormatter.format(value);
}

export function formatCompact(value: number): string {
  return compactFormatter.format(value);
}

/**
 * Trata strings vindas de colunas `@db.Date` (sem hora) como data local.
 * Sem isso, "2026-05-11T00:00:00.000Z" vira 10/05 em fuso BR (UTC-3) porque
 * o Date é interpretado como UTC midnight e recua um dia ao formatar local.
 */
function parseDateInput(date: Date | string): Date {
  if (typeof date !== "string") return date;
  // YYYY-MM-DD ou YYYY-MM-DDT00:00:00(.000)?Z (Prisma @db.Date)
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.000)?Z?)?$/);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(date);
}

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  return dfFormat(parseDateInput(date), pattern, { locale: ptBR });
}

export function formatDateLong(date: Date | string): string {
  return formatDate(date, "dd 'de' MMMM 'de' yyyy");
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm");
}

export function formatTime(date: Date | string): string {
  return formatDate(date, "HH:mm");
}

export function formatRelative(date: Date | string): string {
  return formatDistanceToNow(parseDateInput(date), {
    locale: ptBR,
    addSuffix: true,
  });
}

export function formatWeekday(date: Date | string): string {
  return formatDate(date, "EEEE");
}
