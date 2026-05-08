/**
 * Mapeia hora ("HH:mm") para turno conforme PEND-014:
 * - manhã: 07:00–12:59
 * - tarde: 13:00–17:59
 * - noite: 18:00–19:59
 *
 * Default até confirmação em R2. A configuração futura (Fase 8) virá
 * de `Configuracao.turnosHorarios`.
 */
export type Turno = "manha" | "tarde" | "noite";

export function horaToTurno(hora: string): Turno {
  if (hora < "13:00") return "manha";
  if (hora < "18:00") return "tarde";
  return "noite";
}
