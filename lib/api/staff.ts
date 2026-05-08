import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client";

export type CargoStaff = "atendente" | "auxiliar";

export interface Staff {
  id: string;
  nome: string;
  cargo: CargoStaff;
  email: string;
  telefone: string;
  ativo: boolean;
  senhaDefinida: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffInput {
  nome: string;
  cargo: CargoStaff;
  email: string;
  telefone: string;
}

export type UpdateStaffInput = Partial<CreateStaffInput> & { ativo?: boolean };

export const apiListStaff = (filter?: { ativo?: boolean | "all"; cargo?: CargoStaff }) => {
  const params = new URLSearchParams();
  if (filter?.ativo !== undefined) params.set("ativo", String(filter.ativo));
  if (filter?.cargo) params.set("cargo", filter.cargo);
  const qs = params.toString();
  return apiGet<{ staff: Staff[] }>(`/api/staff${qs ? `?${qs}` : ""}`);
};

export const apiGetStaff = (id: string) => apiGet<{ staff: Staff }>(`/api/staff/${id}`);

export const apiCreateStaff = (input: CreateStaffInput) =>
  apiPost<{ staff: Staff }>("/api/staff", input);

export const apiUpdateStaff = (id: string, input: UpdateStaffInput) =>
  apiPatch<{ staff: Staff }>(`/api/staff/${id}`, input);

export const apiDeactivateStaff = (id: string) =>
  apiDelete<{ staff: Staff }>(`/api/staff/${id}`);
