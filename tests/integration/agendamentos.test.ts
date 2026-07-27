import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET as listGet, POST as createPost } from "@/app/(back-end)/api/agendamentos/route";
import { GET as itemGet } from "@/app/(back-end)/api/agendamentos/[id]/route";
import { POST as cancelPost } from "@/app/(back-end)/api/agendamentos/[id]/cancelar/route";
import { POST as chegadaPost } from "@/app/(back-end)/api/agendamentos/[id]/marcar-chegada/route";
import { GET as ocupadosGet } from "@/app/(back-end)/api/agendamentos/ocupados/route";
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

const ctxId = (id: string) => ({ params: Promise.resolve({ id }) });

async function createFixtures() {
  const paciente = await prisma.paciente.create({
    data: { nome: "Paciente A", email: "pa@e.com", telefone: "11999990000" },
  });
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. A",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 1",
      email: "dra@e.com",
      telefone: "11988887777",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: 0.3,
      duracaoConsultaMinutos: 30,
    },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "Sala 1",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  // Turno fixo cobrindo 2026-06-01 (segunda) 10:00 (manhã) — exigido pelo
  // createAgendamento desde commit d70ec4e (validação dia/turno × turno fixo).
  await prisma.turnoFixo.create({
    data: {
      profissionalId: profissional.id,
      consultorioId: consultorio.id,
      diaSemana: 1,
      turno: "manha",
    },
  });
  return { paciente, profissional, consultorio };
}

describe("POST /api/agendamentos — criar (AG02)", () => {
  it("atendente cria agendamento (201)", async () => {
    const { token } = await createUserWithRole("atendente");
    const { paciente, profissional, consultorio } = await createFixtures();

    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/agendamentos", {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-01",
          hora: "10:00",
        }),
        token,
      ),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.agendamento.status).toBe("agendado");
    expect(body.agendamento.statusPagamento).toBe("pendente");
  });

  it("conflito de horário (AG05) → 409", async () => {
    const { token } = await createUserWithRole("atendente");
    const { paciente, profissional, consultorio } = await createFixtures();
    const paciente2 = await prisma.paciente.create({
      data: { nome: "Paciente B", email: "pb@e.com", telefone: "11988887778" },
    });

    await createPost(
      withAuthCookie(
        jsonRequest("/api/agendamentos", {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-01",
          hora: "10:00",
        }),
        token,
      ),
    );
    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/agendamentos", {
          pacienteId: paciente2.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-01",
          hora: "10:00",
        }),
        token,
      ),
    );
    expect(res.status).toBe(409);
  });

  it("rejeita profissional inativo (400)", async () => {
    const { token } = await createUserWithRole("atendente");
    const { paciente, profissional, consultorio } = await createFixtures();
    await prisma.profissional.update({
      where: { id: profissional.id },
      data: { ativo: false },
    });

    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/agendamentos", {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-01",
          hora: "11:00",
        }),
        token,
      ),
    );
    expect(res.status).toBe(400);
  });

  it("formato de hora inválido → 422", async () => {
    const { token } = await createUserWithRole("atendente");
    const { paciente, profissional, consultorio } = await createFixtures();

    const res = await createPost(
      withAuthCookie(
        jsonRequest("/api/agendamentos", {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: "2026-06-01",
          hora: "10h",
        }),
        token,
      ),
    );
    expect(res.status).toBe(422);
  });
});

describe("GET /api/agendamentos — listar com RBAC (RF-023)", () => {
  it("profissional vê só os próprios agendamentos", async () => {
    const { paciente, profissional, consultorio } = await createFixtures();
    const profB = await prisma.profissional.create({
      data: {
        nome: "Dr. B",
        especialidade: "Pediatria",
        conselho: "CRM-SP 2",
        email: "drb@e.com",
        telefone: "11977776666",
        modalidadeContrato: "percentual",
        valorConsultaBase: 200,
        percentualRepasse: 0.3,
        duracaoConsultaMinutos: 30,
      },
    });

    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "10:00",
          valorConsulta: 0,
        },
        {
          pacienteId: paciente.id,
          profissionalId: profB.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "11:00",
          valorConsulta: 0,
        },
      ],
    });

    // User profissional A — só vê o próprio
    const { user } = await createUserWithRole("profissional", "drA-user@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: profissional.id },
    });
    const token = signAuthToken({ userId: user.id, role: "profissional" });

    const res = await listGet(withAuthCookie(getRequest("/api/agendamentos"), token));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.agendamentos).toHaveLength(1);
    expect(body.agendamentos[0].profissionalId).toBe(profissional.id);
  });

  it("admin vê todos", async () => {
    const { paciente, profissional, consultorio } = await createFixtures();
    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "10:00",
          valorConsulta: 0,
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "10:00",
          valorConsulta: 0,
        },
      ],
    });
    const { token } = await createUserWithRole("admin");
    const res = await listGet(withAuthCookie(getRequest("/api/agendamentos"), token));
    const body = await res.json();
    expect(body.agendamentos).toHaveLength(2);
  });
});

describe("POST /api/agendamentos/[id]/cancelar — AG06", () => {
  async function createAgendamento() {
    const { paciente, profissional, consultorio } = await createFixtures();
    return prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-01"),
        hora: "10:00",
        valorConsulta: 0,
      },
    });
  }

  it("cancela com motivo + grava AuditLog", async () => {
    const { user, token } = await createUserWithRole("atendente");
    const a = await createAgendamento();

    const res = await cancelPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${a.id}/cancelar`, {
          motivo: "Paciente solicitou remarcar",
        }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(200);

    const persisted = await prisma.atendimento.findUnique({ where: { id: a.id } });
    expect(persisted?.status).toBe("cancelado");
    expect(persisted?.motivoCancelamento).toBe("Paciente solicitou remarcar");

    const logs = await prisma.auditLog.findMany({
      where: { entidadeId: a.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBe(user.id);
    expect(logs[0].campo).toBe("status");
    expect(logs[0].valorDepois).toBe("cancelado");
  });

  it("motivo curto → 422", async () => {
    const { token } = await createUserWithRole("atendente");
    const a = await createAgendamento();
    const res = await cancelPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${a.id}/cancelar`, { motivo: "x" }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(422);
  });

  it("rejeita cancelar atendimento já realizado", async () => {
    const { token } = await createUserWithRole("admin");
    const a = await createAgendamento();
    await prisma.atendimento.update({
      where: { id: a.id },
      data: { status: "realizado" },
    });

    const res = await cancelPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${a.id}/cancelar`, { motivo: "Tentar" }),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/agendamentos/[id]/marcar-chegada — AG08", () => {
  async function createAgendamento() {
    const { paciente, profissional, consultorio } = await createFixtures();
    return prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-01"),
        hora: "10:00",
        valorConsulta: 0,
      },
    });
  }

  it("atendente marca chegada → status em_atendimento + audit", async () => {
    const { token } = await createUserWithRole("atendente");
    const a = await createAgendamento();

    const res = await chegadaPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${a.id}/marcar-chegada`, {}),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(200);

    const persisted = await prisma.atendimento.findUnique({ where: { id: a.id } });
    expect(persisted?.status).toBe("em_atendimento");

    const logs = await prisma.auditLog.findMany({
      where: { entidadeId: a.id },
    });
    expect(logs).toHaveLength(1);
    expect(logs[0].valorDepois).toBe("em_atendimento");
  });

  it("profissional NÃO pode marcar chegada (PEND-030) → 403", async () => {
    const { token } = await createUserWithRole("profissional");
    const a = await createAgendamento();

    const res = await chegadaPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${a.id}/marcar-chegada`, {}),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(403);
  });

  it("rejeita se status já é em_atendimento", async () => {
    const { token } = await createUserWithRole("atendente");
    const a = await createAgendamento();
    await prisma.atendimento.update({
      where: { id: a.id },
      data: { status: "em_atendimento" },
    });

    const res = await chegadaPost(
      withAuthCookie(
        jsonRequest(`/api/agendamentos/${a.id}/marcar-chegada`, {}),
        token,
      ),
      ctxId(a.id),
    );
    expect(res.status).toBe(400);
  });
});

describe("GET /api/agendamentos/ocupados — disponibilidade", () => {
  /** Dois agendamentos do mesmo profissional, um deles cancelado. */
  async function agendaComCancelado() {
    const { paciente, profissional, consultorio } = await createFixtures();
    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "10:00",
          valorConsulta: 200,
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "10:30",
          valorConsulta: 200,
          status: "cancelado",
          motivoCancelamento: "Paciente remarcou",
        },
      ],
    });
    return { paciente, profissional, consultorio };
  }

  it("paciente vê horário tomado por OUTRO paciente (é o que faltava para montar slots)", async () => {
    const { profissional } = await agendaComCancelado();
    // Paciente sem relação com o agendamento — em `GET /api/agendamentos` o
    // RBAC devolveria lista vazia e a agenda pareceria livre.
    const outro = await prisma.paciente.create({
      data: { nome: "Paciente B", email: "pb@e.com", telefone: "11900001111" },
    });
    const { user, token } = await createUserWithRole("paciente", "pb-user@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { pacienteId: outro.id },
    });

    const res = await ocupadosGet(
      withAuthCookie(
        getRequest(
          `/api/agendamentos/ocupados?profissionalId=${profissional.id}&data=2026-06-01`,
        ),
        token,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    // 10:00 ocupa; 10:30 estava cancelado, então volta a ficar livre.
    expect(body.ocupados).toEqual([{ data: "2026-06-01", hora: "10:00" }]);
  });

  it("não expõe paciente, valor nem consultório", async () => {
    const { profissional } = await agendaComCancelado();
    const { token } = await createUserWithRole("atendente");

    const res = await ocupadosGet(
      withAuthCookie(
        getRequest(`/api/agendamentos/ocupados?profissionalId=${profissional.id}`),
        token,
      ),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body.ocupados[0]).sort()).toEqual(["data", "hora"]);
  });

  it("filtra por intervalo de datas", async () => {
    const { paciente, profissional, consultorio } = await createFixtures();
    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-01"),
          hora: "10:00",
          valorConsulta: 200,
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-07-06"),
          hora: "11:00",
          valorConsulta: 200,
        },
      ],
    });
    const { token } = await createUserWithRole("admin");

    const res = await ocupadosGet(
      withAuthCookie(
        getRequest(
          `/api/agendamentos/ocupados?profissionalId=${profissional.id}&dataInicio=2026-06-01&dataFim=2026-06-30`,
        ),
        token,
      ),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ocupados).toEqual([
      { data: "2026-06-01", hora: "10:00" },
    ]);
  });

  it("profissional não consulta a agenda de outro profissional (403 — RF-023)", async () => {
    const { profissional } = await createFixtures();
    const outroProf = await prisma.profissional.create({
      data: {
        nome: "Dr. B",
        especialidade: "Pediatria",
        conselho: "CRM-SP 2",
        email: "drb@e.com",
        telefone: "11977776666",
        modalidadeContrato: "percentual",
        valorConsultaBase: 200,
        percentualRepasse: 0.3,
        duracaoConsultaMinutos: 30,
      },
    });
    const { user, token } = await createUserWithRole("profissional", "prof-oc@e.com");
    await prisma.user.update({
      where: { id: user.id },
      data: { profissionalId: outroProf.id },
    });

    const res = await ocupadosGet(
      withAuthCookie(
        getRequest(`/api/agendamentos/ocupados?profissionalId=${profissional.id}`),
        token,
      ),
    );
    expect(res.status).toBe(403);
  });

  it("exige profissionalId (422)", async () => {
    const { token } = await createUserWithRole("admin");
    const res = await ocupadosGet(
      withAuthCookie(getRequest("/api/agendamentos/ocupados"), token),
    );
    expect(res.status).toBe(422);
  });

  it("sem cookie é 401", async () => {
    const res = await ocupadosGet(
      getRequest("/api/agendamentos/ocupados?profissionalId=x"),
    );
    expect(res.status).toBe(401);
  });
});
