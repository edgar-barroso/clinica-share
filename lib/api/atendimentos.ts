import { apiGet, apiPatch, apiPost } from "@/lib/api-client";
import type {
  AgendamentoListItem,
  StatusAgendamento,
  StatusPagamento,
} from "./agendamentos";

export type { StatusAgendamento, StatusPagamento };

/**
 * AT02: procedimento extra do atendimento. `valor` chega como string porque
 * é Decimal(10,2) no banco (RNF-101 / DEC-A03 — nunca float).
 */
export interface ProcedimentoAtendimento {
  id: string;
  descricao: string;
  valor: string;
}

/** Item enviado nos bodies de escrita (`valor` em número, JSON). */
export interface ProcedimentoInput {
  descricao: string;
  valor: number;
}

export interface AtendimentoListItem extends AgendamentoListItem {
  motivoDescontoOuGratuidade?: string | null;
  /** FI06 — preço de tabela quando houve desconto; null se cobrado cheio */
  valorOriginal?: string | null;
  /** AT02 — presente nas rotas de atendimento; ausente nas de agendamento */
  procedimentos?: ProcedimentoAtendimento[];
  /** FI04 — soma dos procedimentos (Decimal em string) */
  valorProcedimentos?: string;
  /** FI04 — valorConsulta + valorProcedimentos */
  valorTotal?: string;
}

export interface AtendimentoDetail extends AtendimentoListItem {
  paciente: AgendamentoListItem["paciente"] & { email?: string };
  profissional: AgendamentoListItem["profissional"] & {
    conselho?: string;
    /** FI06 — preço de tabela do cadastro; base para detectar desconto */
    valorConsultaBase?: string;
  };
  prontuarioInterno: unknown;
  procedimentos: ProcedimentoAtendimento[];
  /** AT04 — atendimento documentado no prontuário próprio do profissional */
  usaProntuarioExterno: boolean;
  /** AT04 — onde o registro externo está (obrigatório quando o de cima é true) */
  referenciaProntuarioExterno: string | null;
}

/** AT04 — campos aceitos por todos os endpoints de escrita de atendimento. */
export interface ProntuarioExternoInput {
  usaProntuarioExterno?: boolean;
  referenciaProntuarioExterno?: string | null;
}

export interface CreateWalkInInput extends ProntuarioExternoInput {
  pacienteId: string;
  profissionalId: string;
  consultorioId: string;
  data: string;
  hora: string;
  valorConsulta: number;
  /** FI06 — preço de tabela; cobrar abaixo dele exige justificativa */
  valorOriginal?: number;
  statusPagamento: StatusPagamento;
  motivoDescontoOuGratuidade?: string;
  prontuarioInterno?: unknown;
  observacoes?: string;
  /** AT02 — máximo 20 itens */
  procedimentos?: ProcedimentoInput[];
}

export interface FinalizarAtendimentoInput extends ProntuarioExternoInput {
  valorConsulta: number;
  /** FI06 — preço de tabela; cobrar abaixo dele exige justificativa */
  valorOriginal?: number;
  statusPagamento: StatusPagamento;
  motivoDescontoOuGratuidade?: string;
  prontuarioInterno?: unknown;
  observacoes?: string;
  /**
   * AT02 — quando enviado SUBSTITUI a lista atual; omitir preserva os
   * procedimentos já registrados.
   */
  procedimentos?: ProcedimentoInput[];
}

export interface UpdateAtendimentoInput extends ProntuarioExternoInput {
  valorConsulta?: number;
  /** FI06 — preço de tabela; cobrar abaixo dele exige justificativa */
  valorOriginal?: number;
  statusPagamento?: StatusPagamento;
  motivoDescontoOuGratuidade?: string | null;
  prontuarioInterno?: unknown;
  observacoes?: string | null;
  /** AT02 — substitui a lista inteira quando enviado */
  procedimentos?: ProcedimentoInput[];
  motivo: string;
}

export const apiListAtendimentos = (filter?: {
  data?: string;
  dataInicio?: string;
  dataFim?: string;
  profissionalId?: string;
  pacienteId?: string;
  consultorioId?: string;
  status?: StatusAgendamento;
  statusPagamento?: StatusPagamento;
}) => {
  const params = new URLSearchParams();
  if (filter?.data) params.set("data", filter.data);
  if (filter?.dataInicio) params.set("dataInicio", filter.dataInicio);
  if (filter?.dataFim) params.set("dataFim", filter.dataFim);
  if (filter?.profissionalId) params.set("profissionalId", filter.profissionalId);
  if (filter?.pacienteId) params.set("pacienteId", filter.pacienteId);
  if (filter?.consultorioId) params.set("consultorioId", filter.consultorioId);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.statusPagamento) params.set("statusPagamento", filter.statusPagamento);
  const qs = params.toString();
  return apiGet<{ atendimentos: AtendimentoListItem[] }>(
    `/api/atendimentos${qs ? `?${qs}` : ""}`,
  );
};

export const apiGetAtendimento = (id: string) =>
  apiGet<{ atendimento: AtendimentoDetail }>(`/api/atendimentos/${id}`);

export const apiCreateWalkIn = (input: CreateWalkInInput) =>
  apiPost<{ atendimento: AtendimentoDetail }>("/api/atendimentos", input);

export const apiFinalizarAtendimento = (
  id: string,
  input: FinalizarAtendimentoInput,
) =>
  apiPost<{ atendimento: AtendimentoDetail }>(
    `/api/atendimentos/${id}/finalizar`,
    input,
  );

export const apiUpdateAtendimento = (id: string, input: UpdateAtendimentoInput) =>
  apiPatch<{ atendimento: AtendimentoDetail }>(`/api/atendimentos/${id}`, input);

export const apiIniciarAtendimento = (id: string) =>
  apiPost<{ atendimento: AtendimentoListItem }>(
    `/api/agendamentos/${id}/iniciar`,
    {},
  );

export const apiNaoCompareceu = (id: string) =>
  apiPost<{ atendimento: AtendimentoListItem }>(
    `/api/agendamentos/${id}/nao-compareceu`,
    {},
  );
