import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET as listGet, POST as createPost } from "@/app/(back-end)/api/pacientes/route";
import {
  GET as itemGet,
  PATCH as itemPatch,
} from "@/app/(back-end)/api/pacientes/[id]/route";
import { prisma } from "@/lib/db";
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

const validInput = {
  nome: "Maria Silva",
  email: "maria@example.com",
  telefone: "11999990000",
};

const ctxId = (id: string) => ({ params: Promise.resolve({ id }) });

describe("POST /api/pacientes", () => {
  it("admin cria paciente com senhaDefinida=false", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/pacientes", validInput), token),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.paciente.nome).toBe("Maria Silva");
    expect(body.paciente.senhaDefinida).toBe(false);
  });

  it("atendente cria paciente (201)", async () => {
    const { token } = await createUserWithRole("atendente");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/pacientes", validInput), token),
    );
    expect(res.status).toBe(201);
  });

  it("auxiliar é negado (só admin/atendente)", async () => {
    const { token } = await createUserWithRole("auxiliar");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/pacientes", validInput), token),
    );
    expect(res.status).toBe(403);
  });

  it("e-mail duplicado → 409", async () => {
    const { token } = await createUserWithRole("admin");
    await createPost(withAuthCookie(jsonRequest("/api/pacientes", validInput), token));
    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/pacientes", { ...validInput, nome: "Outro" }),
        token,
      ),
    );
    expect(res.status).toBe(409);
  });

  it("CPF duplicado → 409", async () => {
    const { token } = await createUserWithRole("admin");
    await createPost(
      withAuthCookie(
        jsonRequest("/api/pacientes", { ...validInput, cpf: "12345678901" }),
        token,
      ),
    );
    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/pacientes", {
          ...validInput,
          email: "outro@example.com",
          cpf: "12345678901",
        }),
        token,
      ),
    );
    expect(res.status).toBe(409);
  });
});

describe("GET /api/pacientes (listar com q)", () => {
  it("filtra por nome (case insensitive)", async () => {
    await prisma.paciente.createMany({
      data: [
        { nome: "Ana Souza", email: "ana@example.com", telefone: "11999990001" },
        { nome: "João Pereira", email: "joao@example.com", telefone: "11999990002" },
      ],
    });
    const { token } = await createUserWithRole("atendente");
    const res = await listGet(
      withAuthCookie(getRequest("/api/pacientes?q=ana"), token),
    );
    const body = await res.json();
    expect(body.pacientes).toHaveLength(1);
    expect(body.pacientes[0].nome).toBe("Ana Souza");
  });
});

describe("GET /api/pacientes/[id] — RBAC paciente", () => {
  it("paciente A não vê paciente B (403)", async () => {
    const pA = await prisma.paciente.create({ data: validInput });
    const pB = await prisma.paciente.create({
      data: { ...validInput, email: "b@example.com" },
    });
    // Cria User vinculado a pA
    const { user } = await createUserWithRole("paciente");
    await prisma.user.update({
      where: { id: user.id },
      data: { pacienteId: pA.id },
    });
    const { signAuthToken } = await import("@/app/(back-end)/_lib/jwt");
    const token = signAuthToken({ userId: user.id, role: "paciente" });

    const res = await itemGet(
      withAuthCookie(getRequest(`/api/pacientes/${pB.id}`), token),
      ctxId(pB.id),
    );
    expect(res.status).toBe(403);
  });

  it("paciente lê próprio cadastro (200)", async () => {
    const p = await prisma.paciente.create({ data: validInput });
    const { user } = await createUserWithRole("paciente", "user-paciente@example.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { pacienteId: p.id },
    });
    const { signAuthToken } = await import("@/app/(back-end)/_lib/jwt");
    const token = signAuthToken({ userId: user.id, role: "paciente" });

    const res = await itemGet(
      withAuthCookie(getRequest(`/api/pacientes/${p.id}`), token),
      ctxId(p.id),
    );
    expect(res.status).toBe(200);
  });
});

describe("PATCH /api/pacientes/[id]", () => {
  it("atendente atualiza telefone do paciente", async () => {
    const p = await prisma.paciente.create({ data: validInput });
    const { token } = await createUserWithRole("atendente");
    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/pacientes/${p.id}`, { telefone: "11988887777" }),
        token,
      ),
      ctxId(p.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.paciente.telefone).toBe("11988887777");
  });

  it("404 para id inexistente", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await itemPatch(
      withAuthCookie(
        jsonRequest("/api/pacientes/nope", { nome: "Nome Valido" }),
        token,
      ),
      ctxId("nope"),
    );
    expect(res.status).toBe(404);
  });
});
