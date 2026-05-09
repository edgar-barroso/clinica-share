import { apiGet, apiPut } from "@/lib/api-client";

export interface TurnoConfig {
  inicio: string; // "HH:mm"
  fim: string;
}
export interface TurnosConfig {
  manha: TurnoConfig;
  tarde: TurnoConfig;
  noite: TurnoConfig;
}

export const apiGetTurnos = () =>
  apiGet<{ turnos: TurnosConfig }>("/api/configuracoes/turnos");

export const apiUpdateTurnos = (turnos: TurnosConfig) =>
  apiPut<{ turnos: TurnosConfig }>("/api/configuracoes/turnos", turnos);
