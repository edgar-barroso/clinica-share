import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET as listGet, POST as createPost } from "@/app/(back-end)/api/staff/route";
import {
  GET as itemGet,
  PATCH as itemPatch,
  DELETE as itemDelete,
} from "@/app/(back-end)/api/staff/[id]/route";
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
  nome: "Carla Atendente",
  cargo: "atendente" as const,
  email: "carla@example.com",
  telefone: "11999990000",
};

const ctxId = (id: string) => ({ params: Promise.resolve({ id }) });

describe("POST /api/staff", () => {
  it("admin cria membro (201) com senhaDefinida=false", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/staff", validInput), token),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.staff.cargo).toBe("atendente");
    expect(body.staff.senhaDefinida).toBe(false);
  });

  it("e-mail duplicado → 409", async () => {
    const { token } = await createUserWithRole("admin");
    await createPost(withAuthCookie(jsonRequest("/api/staff", validInput), token));
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/staff", { ...validInput, nome: "Outra" }), token),
    );
    expect(res.status).toBe(409);
  });

  it("auxiliar é negado (só admin cria)", async () => {
    const { token } = await createUserWithRole("auxiliar");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/staff", validInput), token),
    );
    expect(res.status).toBe(403);
  });

  it("payload com cargo inválido → 422", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/staff", { ...validInput, cargo: "diretor" }), token),
    );
    expect(res.status).toBe(422);
  });
});

describe("GET /api/staff", () => {
  it("admin/auxiliar listam; profissional é negado", async () => {
    await prisma.staff.create({ data: validInput });

    const admin = await createUserWithRole("admin");
    const aux = await createUserWithRole("auxiliar");
    const prof = await createUserWithRole("profissional");

    expect(
      (await listGet(withAuthCookie(getRequest("/api/staff"), admin.token))).status,
    ).toBe(200);
    expect((await listGet(withAuthCookie(getRequest("/api/staff"), aux.token))).status).toBe(
      200,
    );
    expect(
      (await listGet(withAuthCookie(getRequest("/api/staff"), prof.token))).status,
    ).toBe(403);
  });

  it("filtra por cargo", async () => {
    await prisma.staff.create({ data: { ...validInput, email: "a@e.com", cargo: "atendente" } });
    await prisma.staff.create({ data: { ...validInput, email: "b@e.com", cargo: "auxiliar" } });

    const { token } = await createUserWithRole("admin");
    const res = await listGet(
      withAuthCookie(getRequest("/api/staff?cargo=auxiliar"), token),
    );
    const body = await res.json();
    expect(body.staff).toHaveLength(1);
    expect(body.staff[0].cargo).toBe("auxiliar");
  });
});

describe("PATCH+DELETE /api/staff/[id]", () => {
  it("admin atualiza nome", async () => {
    const { token } = await createUserWithRole("admin");
    const s = await prisma.staff.create({ data: validInput });
    const res = await itemPatch(
      withAuthCookie(jsonRequest(`/api/staff/${s.id}`, { nome: "Carla Souza" }), token),
      ctxId(s.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.staff.nome).toBe("Carla Souza");
  });

  it("admin desativa (soft delete)", async () => {
    const { token } = await createUserWithRole("admin");
    const s = await prisma.staff.create({ data: validInput });
    const res = await itemDelete(
      withAuthCookie(getRequest(`/api/staff/${s.id}`), token),
      ctxId(s.id),
    );
    expect(res.status).toBe(200);
    const persisted = await prisma.staff.findUnique({ where: { id: s.id } });
    expect(persisted?.ativo).toBe(false);
  });

  it("404 para id inexistente", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await itemGet(
      withAuthCookie(getRequest("/api/staff/nope"), token),
      ctxId("nope"),
    );
    expect(res.status).toBe(404);
  });
});
