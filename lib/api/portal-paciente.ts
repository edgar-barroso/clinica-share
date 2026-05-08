import { apiGet, apiPatch } from "@/lib/api-client";
import type { Paciente, UpdatePacienteInput } from "./pacientes";

export const apiGetMeuPerfil = () =>
  apiGet<{ paciente: Paciente }>("/api/p/perfil");

export const apiUpdateMeuPerfil = (input: UpdatePacienteInput) =>
  apiPatch<{ paciente: Paciente }>("/api/p/perfil", input);
