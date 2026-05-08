import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { signAuthToken } from "@/app/(back-end)/_lib/jwt";
import { requireRole, requireUser } from "@/app/(back-end)/_lib/require-role";
import { NaoAutenticado, NaoAutorizado } from "@/app/(back-end)/_lib/errors";
import { hashPassword } from "@/app/(back-end)/_lib/password";
import { prisma } from "@/lib/db";
import { cleanAuthData } from "../helpers/db";
import { getRequest, withAuthCookie } from "../helpers/request";

beforeEach(async () => {
  await cleanAuthData();
});

afterAll(async () => {
  await cleanAuthData();
  await prisma.$disconnect();
});

async function createAdminUser() {
  return prisma.user.create({
    data: {
      email: "admin@example.com",
      passwordHash: await hashPassword("senha-forte-123"),
      role: "admin",
    },
  });
}

describe("requireRole — JWT only (sem hit no DB)", () => {
  it("retorna {userId, role} quando role está na allowlist", async () => {
    const token = signAuthToken({ userId: "u-001", role: "admin" });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    const result = requireRole(req, ["admin", "auxiliar"]);
    expect(result.userId).toBe("u-001");
    expect(result.role).toBe("admin");
  });

  it("throw NaoAutenticado quando não há cookie", () => {
    const req = getRequest("/api/whatever");
    expect(() => requireRole(req, ["admin"])).toThrow(NaoAutenticado);
  });

  it("throw NaoAutenticado quando token é inválido", () => {
    const req = withAuthCookie(getRequest("/api/whatever"), "token-falso");
    expect(() => requireRole(req, ["admin"])).toThrow(NaoAutenticado);
  });

  it("throw NaoAutorizado quando role não está na allowlist", () => {
    const token = signAuthToken({ userId: "u-002", role: "paciente" });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    expect(() => requireRole(req, ["admin", "auxiliar"])).toThrow(NaoAutorizado);
  });

  it("não consulta o DB (validação puramente do JWT)", async () => {
    // userId fictício que não existe no DB — deve passar mesmo assim,
    // pois requireRole NÃO valida existência do user
    const token = signAuthToken({ userId: "user-inexistente", role: "admin" });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    const result = requireRole(req, ["admin"]);
    expect(result.userId).toBe("user-inexistente");
  });
});

describe("requireUser — JWT + busca no DB", () => {
  it("retorna User completo com relações quando autenticado e role permitido", async () => {
    const admin = await createAdminUser();
    const token = signAuthToken({ userId: admin.id, role: admin.role });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    const user = await requireUser(req, ["admin"]);
    expect(user.id).toBe(admin.id);
    expect(user.email).toBe("admin@example.com");
    expect(user.role).toBe("admin");
    // relações vêm carregadas (mesmo que null)
    expect("paciente" in user).toBe(true);
    expect("profissional" in user).toBe(true);
    expect("staff" in user).toBe(true);
  });

  it("throw NaoAutorizado quando role não está na allowlist", async () => {
    const admin = await createAdminUser();
    const token = signAuthToken({ userId: admin.id, role: admin.role });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    await expect(requireUser(req, ["paciente"])).rejects.toThrow(NaoAutorizado);
  });

  it("throw NaoAutenticado quando JWT aponta para user que não existe mais", async () => {
    const token = signAuthToken({ userId: "user-deletado", role: "admin" });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    await expect(requireUser(req, ["admin"])).rejects.toThrow(NaoAutenticado);
  });

  it("throw NaoAutenticado quando user existe mas está desativado (ativo=false)", async () => {
    const admin = await createAdminUser();
    await prisma.user.update({ where: { id: admin.id }, data: { ativo: false } });
    const token = signAuthToken({ userId: admin.id, role: admin.role });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    await expect(requireUser(req, ["admin"])).rejects.toThrow(NaoAutenticado);
  });

  it("throw NaoAutenticado sem cookie", async () => {
    const req = getRequest("/api/whatever");
    await expect(requireUser(req, ["admin"])).rejects.toThrow(NaoAutenticado);
  });

  it("aceita allowlist vazia/undefined = qualquer role autenticado", async () => {
    const admin = await createAdminUser();
    const token = signAuthToken({ userId: admin.id, role: admin.role });
    const req = withAuthCookie(getRequest("/api/whatever"), token);

    const user = await requireUser(req);
    expect(user.id).toBe(admin.id);
  });
});
