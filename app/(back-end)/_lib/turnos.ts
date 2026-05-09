/**
 * Mapeia hora ("HH:mm") para turno conforme a configuração persistida
 * em /configuracoes/turnos.
 *
 * A versão sem `config` mantém os defaults (07–13 / 13–18 / 18–20) para
 * casos legados — testes e cálculos antigos. O caminho preferido é passar
 * `TurnosConfig` carregada via `getTurnos()`.
 */
import type { TurnosConfig } from "@/app/(back-end)/_usecases/configuracao/turnos";

export type Turno = "manha" | "tarde" | "noite";

const DEFAULT_TARDE_INICIO = "13:00";
const DEFAULT_NOITE_INICIO = "18:00";

export function horaToTurno(hora: string, config?: TurnosConfig): Turno {
  const tardeInicio = config?.tarde.inicio ?? DEFAULT_TARDE_INICIO;
  const noiteInicio = config?.noite.inicio ?? DEFAULT_NOITE_INICIO;
  if (hora < tardeInicio) return "manha";
  if (hora < noiteInicio) return "tarde";
  return "noite";
}
