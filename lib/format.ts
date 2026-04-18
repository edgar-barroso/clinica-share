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

export function formatDate(date: Date | string, pattern = "dd/MM/yyyy"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return dfFormat(d, pattern, { locale: ptBR });
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
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true });
}

export function formatWeekday(date: Date | string): string {
  return formatDate(date, "EEEE");
}
