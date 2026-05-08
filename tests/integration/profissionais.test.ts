import { afterAll, beforeEach, describe, expect, it } from "vitest";
import {
  GET as listGet,
  POST as createPost,
} from "@/app/(back-end)/api/profissionais/route";
import {
  GET as itemGet,
  PATCH as itemPatch,
  DELETE as itemDelete,
} from "@/app/(back-end)/api/profissionais/[id]/route";
import { POST as turnoPost } from "@/app/(back-end)/api/profissionais/[id]/turnos-fixos/route";
import { DELETE as turnoDelete } from "@/app/(back-end)/api/profissionais/[id]/turnos-fixos/[turnoId]/route";
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

const validProfPercentual = {
  nome: "Dra. Ana",
  especialidade: "Cardiologia",
  conselho: "CRM-SP 12345",
  email: "ana@example.com",
  telefone: "11999990000",
  modalidadeContrato: "percentual" as const,
  percentualRepasse: 0.3,
  duracaoConsultaMinutos: 30,
};

const validProfAluguel = {
  nome: "Dr. Bruno",
  especialidade: "Ortopedia",
  conselho: "CRM-SP 67890",
  email: "bruno@example.com",
  telefone: "11988887777",
  modalidadeContrato: "aluguel_fixo" as const,
  valorAluguelPorTurno: 200,
  duracaoConsultaMinutos: 30,
};

function ctxId(id: string) {
  return { params: Promise.resolve({ id }) };
}
function ctxIdTurno(id: string, turnoId: string) {
  return { params: Promise.resolve({ id, turnoId }) };
}

describe("POST /api/profissionais", () => {
  it("admin cria profissional percentual (201)", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/profissionais", validProfPercentual), token),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.profissional.modalidadeContrato).toBe("percentual");
    expect(Number(body.profissional.percentualRepasse)).toBe(0.3);
  });

  it("admin cria profissional aluguel-fixo (201)", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/profissionais", validProfAluguel), token),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.profissional.modalidadeContrato).toBe("aluguel_fixo");
  });

  it("rejeita modalidade percentual sem percentualRepasse (422)", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/profissionais", {
          ...validProfPercentual,
          percentualRepasse: undefined,
        }),
        token,
      ),
    );
    expect(res.status).toBe(422);
  });

  it("rejeita aluguel_fixo sem valorAluguelPorTurno (422)", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/profissionais", {
          ...validProfAluguel,
          valorAluguelPorTurno: undefined,
        }),
        token,
      ),
    );
    expect(res.status).toBe(422);
  });

  it("rejeita e-mail duplicado (409)", async () => {
    const { token } = await createUserWithRole("admin");
    await createPost(
      withAuthCookie(jsonRequest("/api/profissionais", validProfPercentual), token),
    );
    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/profissionais", { ...validProfPercentual, nome: "Outra" }),
        token,
      ),
    );
    expect(res.status).toBe(409);
  });

  it("paciente é negado (403)", async () => {
    const { token } = await createUserWithRole("paciente");
    const res = await createPost(
      withAuthCookie(jsonRequest("/api/profissionais", validProfPercentual), token),
    );
    expect(res.status).toBe(403);
  });
});

describe("GET /api/profissionais", () => {
  it("retorna lista com turnosFixos vazio para profissional novo", async () => {
    await prisma.profissional.create({
      data: { ...validProfPercentual, percentualRepasse: 0.3 },
    });
    const { token } = await createUserWithRole("atendente");
    const res = await listGet(withAuthCookie(getRequest("/api/profissionais"), token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profissionais).toHaveLength(1);
    expect(body.profissionais[0].turnosFixos).toEqual([]);
  });
});

describe("PATCH /api/profissionais/[id] — audit em contrato", () => {
  it("alterar percentualRepasse exige motivo (400 sem motivo)", async () => {
    const { token } = await createUserWithRole("admin");
    const prof = await prisma.profissional.create({
      data: { ...validProfPercentual, percentualRepasse: 0.3 },
    });

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/profissionais/${prof.id}`, { percentualRepasse: 0.4 }),
        token,
      ),
      ctxId(prof.id),
    );
    expect(res.status).toBe(400);
  });

  it("alterar percentualRepasse com motivo grava AuditLog", async () => {
    const { user, token } = await createUserWithRole("admin");
    const prof = await prisma.profissional.create({
      data: { ...validProfPercentual, percentualRepasse: 0.3 },
    });

    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/profissionais/${prof.id}`, {
          percentualRepasse: 0.4,
          motivo: "Renegociação anual",
        }),
        token,
      ),
      ctxId(prof.id),
    );
    expect(res.status).toBe(200);

    const logs = await prisma.auditLog.findMany({
      where: { entidade: "Profissional", entidadeId: prof.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].campo).toBe("percentualRepasse");
    expect(logs[0].userId).toBe(user.id);
    expect(logs[0].motivo).toBe("Renegociação anual");
  });

  it("alterar nome (campo não-financeiro) NÃO exige motivo", async () => {
    const { token } = await createUserWithRole("admin");
    const prof = await prisma.profissional.create({
      data: { ...validProfPercentual, percentualRepasse: 0.3 },
    });
    const res = await itemPatch(
      withAuthCookie(
        jsonRequest(`/api/profissionais/${prof.id}`, { nome: "Dra. Ana Maria" }),
        token,
      ),
      ctxId(prof.id),
    );
    expect(res.status).toBe(200);
    const logs = await prisma.auditLog.findMany();
    expect(logs).toHaveLength(0);
  });
});

describe("Turno fixo (POST/DELETE)", () => {
  async function createProfAndConsultorio() {
    const prof = await prisma.profissional.create({
      data: { ...validProfPercentual, percentualRepasse: 0.3 },
    });
    const consultorio = await prisma.consultorio.create({
      data: { nome: "C1", tipo: "Clínico", equipamentos: [], especialidadesCompativeis: [] },
    });
    return { prof, consultorio };
  }

  it("admin adiciona turno fixo (201)", async () => {
    const { token } = await createUserWithRole("admin");
    const { prof, consultorio } = await createProfAndConsultorio();

    const res = await turnoPost(
      withAuthCookie(
        jsonRequest(`/api/profissionais/${prof.id}/turnos-fixos`, {
          consultorioId: consultorio.id,
          diaSemana: 1,
          turno: "manha",
        }),
        token,
      ),
      ctxId(prof.id),
    );
    expect(res.status).toBe(201);
  });

  it("conflito quando consultório já alocado em mesmo dia/turno (409)", async () => {
    const { token } = await createUserWithRole("admin");
    const { prof, consultorio } = await createProfAndConsultorio();
    const prof2 = await prisma.profissional.create({
      data: { ...validProfAluguel, valorAluguelPorTurno: 200 },
    });

    await turnoPost(
      withAuthCookie(
        jsonRequest(`/api/profissionais/${prof.id}/turnos-fixos`, {
          consultorioId: consultorio.id,
          diaSemana: 1,
          turno: "manha",
        }),
        token,
      ),
      ctxId(prof.id),
    );

    const res2 = await turnoPost(
      withAuthCookie(
        jsonRequest(`/api/profissionais/${prof2.id}/turnos-fixos`, {
          consultorioId: consultorio.id,
          diaSemana: 1,
          turno: "manha",
        }),
        token,
      ),
      ctxId(prof2.id),
    );
    expect(res2.status).toBe(409);
  });

  it("admin remove turno (200)", async () => {
    const { token } = await createUserWithRole("admin");
    const { prof, consultorio } = await createProfAndConsultorio();
    const turno = await prisma.turnoFixo.create({
      data: {
        profissionalId: prof.id,
        consultorioId: consultorio.id,
        diaSemana: 2,
        turno: "tarde",
      },
    });

    const res = await turnoDelete(
      withAuthCookie(getRequest(`/api/profissionais/${prof.id}/turnos-fixos/${turno.id}`), token),
      ctxIdTurno(prof.id, turno.id),
    );
    expect(res.status).toBe(200);

    const remaining = await prisma.turnoFixo.findMany();
    expect(remaining).toHaveLength(0);
  });
});

describe("DELETE /api/profissionais/[id]", () => {
  it("admin desativa (soft delete)", async () => {
    const { token } = await createUserWithRole("admin");
    const prof = await prisma.profissional.create({
      data: { ...validProfPercentual, percentualRepasse: 0.3 },
    });
    const res = await itemDelete(
      withAuthCookie(getRequest(`/api/profissionais/${prof.id}`), token),
      ctxId(prof.id),
    );
    expect(res.status).toBe(200);
    const persisted = await prisma.profissional.findUnique({ where: { id: prof.id } });
    expect(persisted?.ativo).toBe(false);
  });
});

describe("GET /api/profissionais/[id]", () => {
  it("404 para id inexistente", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await itemGet(
      withAuthCookie(getRequest("/api/profissionais/nope"), token),
      ctxId("nope"),
    );
    expect(res.status).toBe(404);
  });
});
