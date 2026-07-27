import { apiGet, apiPost } from "@/lib/api-client";
import type { ModalidadeContrato } from "./profissionais";

export type StatusRepasse = "aberto" | "pago";
export type Turno = "manha" | "tarde" | "noite";

export interface RepasseListItem {
  id: string;
  profissionalId: string;
  periodoInicio: string;
  periodoFim: string;
  receitaBruta: string;
  valorRepasse: string;
  status: StatusRepasse;
  dataPagamento: string | null;
  profissional: {
    id: string;
    nome: string;
    especialidade: string;
    modalidadeContrato: ModalidadeContrato;
  };
  atendimentos: { id: string }[];
  createdAt: string;
  updatedAt: string;
}

/** FI04: procedimento extra cobrado dentro de um atendimento. */
export interface RepasseProcedimento {
  descricao: string;
  valor: string;
}

export interface RepasseBreakdownItem {
  atendimentoId: string;
  data: string;
  hora: string;
  turno: Turno;
  valorConsulta: string;
  /** FI04: soma dos procedimentos extras deste atendimento. */
  valorProcedimentos: string;
  /** valorConsulta + valorProcedimentos — o que de fato entra na base. */
  valorTotal: string;
  procedimentos: RepasseProcedimento[];
  statusPagamento: "pago" | "pendente" | "gratuito";
}

export interface RepasseBreakdown {
  modalidade: ModalidadeContrato;
  receitaBruta: string;
  valorRepasse: string;
  atendimentosIds: string[];
  turnosUtilizados: { data: string; turno: Turno }[];
  detalhes: RepasseBreakdownItem[];
}

export interface RepasseDetalheResponse {
  repasse: Omit<RepasseListItem, "profissional" | "atendimentos"> & {
    profissional: RepasseListItem["profissional"] & {
      percentualRepasse: string | null;
      valorAluguelPorTurno: string | null;
    };
    atendimentos: {
      id: string;
      data: string;
      hora: string;
      valorConsulta: string;
      statusPagamento: "pago" | "pendente" | "gratuito";
      paciente: { id: string; nome: string };
      consultorio: { id: string; nome: string };
    }[];
  };
  breakdown: RepasseBreakdown;
}

export const apiListRepasses = (filter?: {
  profissionalId?: string;
  status?: StatusRepasse;
  periodoInicio?: string;
  periodoFim?: string;
}) => {
  const params = new URLSearchParams();
  if (filter?.profissionalId) params.set("profissionalId", filter.profissionalId);
  if (filter?.status) params.set("status", filter.status);
  if (filter?.periodoInicio) params.set("periodoInicio", filter.periodoInicio);
  if (filter?.periodoFim) params.set("periodoFim", filter.periodoFim);
  const qs = params.toString();
  return apiGet<{ repasses: RepasseListItem[] }>(
    `/api/repasses${qs ? `?${qs}` : ""}`,
  );
};

export const apiGetRepasse = (id: string) =>
  apiGet<RepasseDetalheResponse>(`/api/repasses/${id}`);

export const apiMarcarRepassePago = (id: string, motivo?: string) =>
  apiPost<{ repasse: RepasseListItem }>(
    `/api/repasses/${id}/marcar-pago`,
    motivo ? { motivo } : {},
  );
