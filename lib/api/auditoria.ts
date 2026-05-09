import { apiGet } from "@/lib/api-client";

export interface AuditLogItem {
  id: string;
  userId: string;
  userNome: string;
  entidade: string;
  entidadeId: string;
  campo: string;
  valorAntes: string;
  valorDepois: string;
  motivo: string;
  timestamp: string;
}

export const apiListAuditoria = (filter?: {
  entidade?: string;
  entidadeId?: string;
  userId?: string;
  campo?: string;
  dataInicio?: string;
  dataFim?: string;
}) => {
  const p = new URLSearchParams();
  if (filter) {
    for (const [k, v] of Object.entries(filter)) {
      if (typeof v === "string" && v.length > 0) p.set(k, v);
    }
  }
  const qs = p.toString();
  return apiGet<{ logs: AuditLogItem[] }>(
    `/api/auditoria${qs ? `?${qs}` : ""}`,
  );
};
