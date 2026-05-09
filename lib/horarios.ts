/**
 * Geração de slots de horário a partir da duração padrão do profissional
 * e dos blocos (manhã/tarde/noite) configurados em /configuracoes/turnos.
 *
 * Os slots são gerados em passo igual à `duracaoConsultaMinutos` do
 * profissional. Um slot só é incluído se o horário inteiro (início → fim)
 * couber dentro do bloco.
 */

import type { TurnosConfig } from "@/lib/api/configuracoes";

export interface Bloco {
  periodo: string;
  inicio: string; // "HH:MM"
  fim: string; // "HH:MM"
}

/**
 * Fallback caso a config ainda não tenha sido carregada do servidor.
 * Em uso real, as telas devem aguardar o fetch para evitar mostrar
 * blocos divergentes do que foi configurado.
 */
export const BLOCOS_PADRAO: Bloco[] = [
  { periodo: "Manhã", inicio: "07:00", fim: "12:00" },
  { periodo: "Tarde", inicio: "13:00", fim: "18:00" },
  { periodo: "Noite", inicio: "18:00", fim: "20:00" },
];

/**
 * Converte `TurnosConfig` (vindo da API) em `Bloco[]` na ordem
 * manhã → tarde → noite, com labels já em pt-BR.
 */
export function turnosConfigParaBlocos(turnos: TurnosConfig): Bloco[] {
  return [
    { periodo: "Manhã", inicio: turnos.manha.inicio, fim: turnos.manha.fim },
    { periodo: "Tarde", inicio: turnos.tarde.inicio, fim: turnos.tarde.fim },
    { periodo: "Noite", inicio: turnos.noite.inicio, fim: turnos.noite.fim },
  ];
}

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export interface BlocoComSlots {
  periodo: string;
  slots: string[];
}

export function gerarSlots(
  blocos: Bloco[],
  duracaoMin: number,
): BlocoComSlots[] {
  if (duracaoMin <= 0) return [];
  return blocos
    .map((b) => {
      const ini = toMinutes(b.inicio);
      const fim = toMinutes(b.fim);
      const slots: string[] = [];
      for (let t = ini; t + duracaoMin <= fim; t += duracaoMin) {
        slots.push(toHHMM(t));
      }
      return { periodo: b.periodo, slots };
    })
    .filter((b) => b.slots.length > 0);
}

/**
 * Um slot conflita com `ocupados` se houver sobreposição de intervalo
 * (start < otherEnd && end > otherStart). Considera que cada agendamento
 * existente tem a mesma `duracaoMin` do profissional atual.
 */
export function slotConflita(
  slot: string,
  ocupados: Iterable<string>,
  duracaoMin: number,
): boolean {
  const inicio = toMinutes(slot);
  const fim = inicio + duracaoMin;
  for (const o of ocupados) {
    const oInicio = toMinutes(o);
    const oFim = oInicio + duracaoMin;
    if (inicio < oFim && fim > oInicio) return true;
  }
  return false;
}
