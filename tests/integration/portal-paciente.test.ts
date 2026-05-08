import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  GET as perfilGet,
  PATCH as perfilPatch,
} from "@/app/(back-end)/api/p/perfil/route";
import { prisma } from "@/lib/db";
import { signAuthToken } from "@/app/(back-end)/_lib/jwt";
import { cleanDb } from "../helpers/db";
import { createUserWithRole } from "../helpers/auth";
import { jsonRequest, getRequest, withAuthCookie } from "../helpers/request";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

describe("GET /api/p/perfil", () => {
  it("paciente lê próprio perfil", async () => {
    const paciente = await prisma.paciente.create({
      data: { nome: "Maria", email: "m@e.com", telefone: "11900000000" },
    });
    const { user } = await createUserWithRole("paciente", "u-mar@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { pacienteId: paciente.id },
    });
    const token = signAuthToken({ userId: user.id, role: "paciente" });

    const res = await perfilGet(
      withAuthCookie(getRequest("/api/p/perfil"), token),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paciente.id).toBe(paciente.id);
  });

  it("admin é negado (rota é exclusiva de paciente)", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await perfilGet(
      withAuthCookie(getRequest("/api/p/perfil"), token),
    );
    expect(res.status).toBe(403);
  });

  it("paciente sem registro vinculado → 403", async () => {
    const { user } = await createUserWithRole("paciente", "u-orphan@e.com");
    const token = signAuthToken({ userId: user.id, role: "paciente" });

    const res = await perfilGet(
      withAuthCookie(getRequest("/api/p/perfil"), token),
    );
    expect(res.status).toBe(403);
  });
});

describe("PATCH /api/p/perfil", () => {
  it("paciente atualiza próprio telefone", async () => {
    const paciente = await prisma.paciente.create({
      data: { nome: "Maria", email: "m@e.com", telefone: "11900000000" },
    });
    const { user } = await createUserWithRole("paciente", "u-mar2@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { pacienteId: paciente.id },
    });
    const token = signAuthToken({ userId: user.id, role: "paciente" });

    const res = await perfilPatch(
      withAuthCookie(
        jsonRequest("/api/p/perfil", { telefone: "11988887777" }),
        token,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paciente.telefone).toBe("11988887777");
  });
});
