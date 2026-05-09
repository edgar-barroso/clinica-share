import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET as listGet, POST as createPost } from "@/app/(back-end)/api/consultorios/route";
import {
  GET as itemGet,
  PATCH as itemPatch,
  DELETE as itemDelete,
} from "@/app/(back-end)/api/consultorios/[id]/route";
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
  nome: "Consultório 1",
  tipo: "Clínico",
  equipamentos: ["Maca", "Mesa"],
  especialidadesCompativeis: ["Clínica geral"],
};

function ctxWithId(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/consultorios — criar", () => {
  it("admin cria consultório (201)", async () => {
    const { token } = await createUserWithRole("admin");
    const req = withAuthCookie(jsonRequest("/api/consultorios", validInput), token);
    const res = await createPost(req);

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.consultorio.nome).toBe("Consultório 1");
    expect(body.consultorio.ativo).toBe(true);
    expect(body.consultorio.equipamentos).toEqual(["Maca", "Mesa"]);
  });

  it("paciente é negado (403)", async () => {
    const { token } = await createUserWithRole("paciente");
    const req = withAuthCookie(jsonRequest("/api/consultorios", validInput), token);
    expect((await createPost(req)).status).toBe(403);
  });

  it("atendente é negado (403)", async () => {
    const { token } = await createUserWithRole("atendente");
    const req = withAuthCookie(jsonRequest("/api/consultorios", validInput), token);
    expect((await createPost(req)).status).toBe(403);
  });

  it("sem cookie → 401", async () => {
    const req = jsonRequest("/api/consultorios", validInput);
    expect((await createPost(req)).status).toBe(401);
  });

  it("payload inválido → 422", async () => {
    const { token } = await createUserWithRole("admin");
    const req = withAuthCookie(
      jsonRequest("/api/consultorios", { nome: "x", tipo: "" }),
      token,
    );
    expect((await createPost(req)).status).toBe(422);
  });
});

describe("GET /api/consultorios — listar", () => {
  it("retorna lista ordenada por nome", async () => {
    await prisma.consultorio.createMany({
      data: [
        { ...validInput, nome: "Z Consultório" },
        { ...validInput, nome: "A Consultório" },
      ],
    });
    const { token } = await createUserWithRole("atendente");
    const res = await listGet(withAuthCookie(getRequest("/api/consultorios"), token));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.consultorios).toHaveLength(2);
    expect(body.consultorios[0].nome).toBe("A Consultório");
    expect(body.consultorios[1].nome).toBe("Z Consultório");
  });

  it("filtra por ativo=false", async () => {
    await prisma.consultorio.create({ data: { ...validInput, ativo: true, nome: "Ativo" } });
    await prisma.consultorio.create({
      data: { ...validInput, ativo: false, nome: "Inativo" },
    });
    const { token } = await createUserWithRole("admin");
    const res = await listGet(
      withAuthCookie(getRequest("/api/consultorios?ativo=false"), token),
    );
    const body = await res.json();
    expect(body.consultorios).toHaveLength(1);
    expect(body.consultorios[0].nome).toBe("Inativo");
  });

  it("sem cookie → 401", async () => {
    expect((await listGet(getRequest("/api/consultorios"))).status).toBe(401);
  });
});

describe("GET /api/consultorios/[id]", () => {
  it("retorna consultório existente", async () => {
    const c = await prisma.consultorio.create({ data: validInput });
    const { token } = await createUserWithRole("profissional");
    const res = await itemGet(
      withAuthCookie(getRequest(`/api/consultorios/${c.id}`), token),
      ctxWithId(c.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.consultorio.id).toBe(c.id);
  });

  it("404 para id inexistente", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await itemGet(
      withAuthCookie(getRequest("/api/consultorios/inexistente"), token),
      ctxWithId("inexistente"),
    );
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/consultorios/[id]", () => {
  it("admin atualiza nome", async () => {
    const c = await prisma.consultorio.create({ data: validInput });
    const { token } = await createUserWithRole("admin");
    const res = await itemPatch(
      withAuthCookie(jsonRequest(`/api/consultorios/${c.id}`, { nome: "Novo nome" }), token),
      ctxWithId(c.id),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.consultorio.nome).toBe("Novo nome");
  });

  it("auxiliar é negado (só admin)", async () => {
    const c = await prisma.consultorio.create({ data: validInput });
    const { token } = await createUserWithRole("auxiliar");
    const res = await itemPatch(
      withAuthCookie(jsonRequest(`/api/consultorios/${c.id}`, { nome: "X" }), token),
      ctxWithId(c.id),
    );
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/consultorios/[id] — soft delete", () => {
  it("admin desativa (não apaga)", async () => {
    const c = await prisma.consultorio.create({ data: validInput });
    const { token } = await createUserWithRole("admin");
    const res = await itemDelete(
      withAuthCookie(getRequest(`/api/consultorios/${c.id}`), token),
      ctxWithId(c.id),
    );
    expect(res.status).toBe(200);

    const persisted = await prisma.consultorio.findUnique({ where: { id: c.id } });
    expect(persisted).not.toBeNull();
    expect(persisted?.ativo).toBe(false);
  });
});
