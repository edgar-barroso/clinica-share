import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { audit } from "@/app/(back-end)/_lib/audit";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/app/(back-end)/_lib/password";
import { cleanAuthData } from "../helpers/db";

beforeEach(async () => {
  await cleanAuthData();
});

afterAll(async () => {
  await cleanAuthData();
  await prisma.$disconnect();
});

async function createTestUser() {
  return prisma.user.create({
    data: {
      email: "auditor@example.com",
      passwordHash: await hashPassword("senha-forte-123"),
      role: "admin",
    },
  });
}

describe("audit() helper", () => {
  it("grava AuditLog com todos os campos do payload", async () => {
    const user = await createTestUser();

    await audit({
      user,
      entidade: "Atendimento",
      entidadeId: "atd-001",
      campo: "valorConsulta",
      valorAntes: "100.00",
      valorDepois: "150.00",
      motivo: "Reajuste de tabela",
    });

    const logs = await prisma.auditLog.findMany({ where: { userId: user.id } });
    expect(logs).toHaveLength(1);
    const log = logs[0];
    expect(log.userId).toBe(user.id);
    expect(log.userNome).toBe(user.email);
    expect(log.entidade).toBe("Atendimento");
    expect(log.entidadeId).toBe("atd-001");
    expect(log.campo).toBe("valorConsulta");
    expect(log.valorAntes).toBe("100.00");
    expect(log.valorDepois).toBe("150.00");
    expect(log.motivo).toBe("Reajuste de tabela");
    expect(log.timestamp).toBeInstanceOf(Date);
  });

  it("usa nome do Paciente quando user tem paciente vinculado", async () => {
    const paciente = await prisma.paciente.create({
      data: {
        nome: "Maria Silva",
        email: "maria@example.com",
        telefone: "11999990000",
        senhaDefinida: true,
      },
    });
    const user = await prisma.user.create({
      data: {
        email: "maria@example.com",
        passwordHash: await hashPassword("senha-forte-123"),
        role: "paciente",
        pacienteId: paciente.id,
      },
      include: { paciente: true, profissional: true, staff: true },
    });

    await audit({
      user,
      entidade: "Paciente",
      entidadeId: paciente.id,
      campo: "telefone",
      valorAntes: "11999990000",
      valorDepois: "11988887777",
      motivo: "Atualização cadastral",
    });

    const log = await prisma.auditLog.findFirst({ where: { userId: user.id } });
    expect(log?.userNome).toBe("Maria Silva");
  });

  it("aceita motivo vazio quando regulamento permite (ex: actions de sistema)", async () => {
    const user = await createTestUser();

    await audit({
      user,
      entidade: "Repasse",
      entidadeId: "rep-001",
      campo: "status",
      valorAntes: "aberto",
      valorDepois: "pago",
      motivo: "",
    });

    const log = await prisma.auditLog.findFirst({ where: { userId: user.id } });
    expect(log?.motivo).toBe("");
  });

  it("permite múltiplos logs sequenciais para a mesma entidade", async () => {
    const user = await createTestUser();

    await audit({
      user,
      entidade: "Atendimento",
      entidadeId: "atd-002",
      campo: "valorConsulta",
      valorAntes: "100",
      valorDepois: "120",
      motivo: "Ajuste 1",
    });
    await audit({
      user,
      entidade: "Atendimento",
      entidadeId: "atd-002",
      campo: "statusPagamento",
      valorAntes: "pendente",
      valorDepois: "pago",
      motivo: "Pagamento confirmado",
    });

    const logs = await prisma.auditLog.findMany({
      where: { entidadeId: "atd-002" },
      orderBy: { timestamp: "asc" },
    });
    expect(logs).toHaveLength(2);
    expect(logs[0].campo).toBe("valorConsulta");
    expect(logs[1].campo).toBe("statusPagamento");
  });
});
