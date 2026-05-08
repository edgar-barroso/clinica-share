import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export interface ListAuditoriaFilter {
  entidade?: string;
  entidadeId?: string;
  userId?: string;
  campo?: string;
  dataInicio?: string;
  dataFim?: string;
}

/**
 * Lista AuditLog com filtros opcionais. Restrito a admin/auxiliar
 * (toda checagem de role fica na rota).
 */
export async function listAuditoria(filter: ListAuditoriaFilter) {
  const where: Prisma.AuditLogWhereInput = {};
  if (filter.entidade) where.entidade = filter.entidade;
  if (filter.entidadeId) where.entidadeId = filter.entidadeId;
  if (filter.userId) where.userId = filter.userId;
  if (filter.campo) where.campo = filter.campo;
  if (filter.dataInicio || filter.dataFim) {
    where.timestamp = {};
    if (filter.dataInicio) where.timestamp.gte = new Date(filter.dataInicio);
    if (filter.dataFim) {
      const fim = new Date(filter.dataFim);
      fim.setHours(23, 59, 59, 999);
      where.timestamp.lte = fim;
    }
  }

  return prisma.auditLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
    take: 200,
  });
}
