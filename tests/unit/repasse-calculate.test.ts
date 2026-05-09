import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateRepasse } from "@/app/(back-end)/_usecases/repasse/calculate";
import { cleanDb } from "../helpers/db";

beforeEach(async () => {
  await cleanDb();
});

afterAll(async () => {
  await cleanDb();
  await prisma.$disconnect();
});

const PERIODO_INICIO = "2026-06-01"; // segunda
const PERIODO_FIM = "2026-06-07"; // domingo

async function fixturePercentual(percentual: number) {
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. Percentual",
      especialidade: "Clínica geral",
      conselho: "CRM-SP 100",
      email: "perc@e.com",
      telefone: "11999990000",
      modalidadeContrato: "percentual",
      valorConsultaBase: 200,
      percentualRepasse: new Prisma.Decimal(percentual),
      duracaoConsultaMinutos: 30,
    },
  });
  const paciente = await prisma.paciente.create({
    data: { nome: "P", email: "p@e.com", telefone: "11900000000" },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "S1",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  return { profissional, paciente, consultorio };
}

async function fixtureAluguel(valorAluguel: number) {
  const profissional = await prisma.profissional.create({
    data: {
      nome: "Dr. Aluguel",
      especialidade: "Pediatria",
      conselho: "CRM-SP 200",
      email: "alu@e.com",
      telefone: "11988887777",
      modalidadeContrato: "aluguel_fixo",
      valorConsultaBase: 200,
      valorAluguelPorTurno: new Prisma.Decimal(valorAluguel),
      duracaoConsultaMinutos: 30,
    },
  });
  const paciente = await prisma.paciente.create({
    data: { nome: "PA", email: "pa@e.com", telefone: "11900000001" },
  });
  const consultorio = await prisma.consultorio.create({
    data: {
      nome: "S2",
      tipo: "Clínico",
      equipamentos: [],
      especialidadesCompativeis: [],
    },
  });
  return { profissional, paciente, consultorio };
}

describe("calculateRepasse — modalidade percentual", () => {
  it("3 atendimentos pago × 30% = soma×0.3", async () => {
    const { profissional, paciente, consultorio } = await fixturePercentual(0.3);
    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(200),
          status: "realizado",
          statusPagamento: "pago",
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-03"),
          hora: "11:00",
          valorConsulta: new Prisma.Decimal(150),
          status: "realizado",
          statusPagamento: "pago",
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-04"),
          hora: "14:00",
          valorConsulta: new Prisma.Decimal(250),
          status: "realizado",
          statusPagamento: "pago",
        },
      ],
    });

    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(result.modalidade).toBe("percentual");
    expect(result.receitaBruta.toFixed(2)).toBe("600.00");
    expect(result.valorRepasse.toFixed(2)).toBe("180.00");
    expect(result.atendimentosIds).toHaveLength(3);
  });

  it("ignora gratuito, cancelado, nao_compareceu, pendente", async () => {
    const { profissional, paciente, consultorio } = await fixturePercentual(0.5);
    await prisma.atendimento.createMany({
      data: [
        // pago — entra
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(200),
          status: "realizado",
          statusPagamento: "pago",
        },
        // gratuito — fora
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "11:00",
          valorConsulta: new Prisma.Decimal(100),
          status: "realizado",
          statusPagamento: "gratuito",
          motivoDescontoOuGratuidade: "Cortesia",
        },
        // pendente — fora
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-03"),
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(150),
          status: "realizado",
          statusPagamento: "pendente",
        },
        // cancelado — fora
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-04"),
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(300),
          status: "cancelado",
          statusPagamento: "pendente",
          motivoCancelamento: "x",
        },
        // nao_compareceu — fora
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-05"),
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(400),
          status: "nao_compareceu",
          statusPagamento: "pendente",
        },
      ],
    });

    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });

    expect(result.receitaBruta.toFixed(2)).toBe("200.00");
    expect(result.valorRepasse.toFixed(2)).toBe("100.00");
    expect(result.atendimentosIds).toHaveLength(1);
  });

  it("período sem atendimentos → repasse zero", async () => {
    const { profissional } = await fixturePercentual(0.3);
    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    expect(result.receitaBruta.toFixed(2)).toBe("0.00");
    expect(result.valorRepasse.toFixed(2)).toBe("0.00");
    expect(result.atendimentosIds).toHaveLength(0);
  });

  it("ignora atendimentos fora do período", async () => {
    const { profissional, paciente, consultorio } = await fixturePercentual(0.4);
    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-05-30"), // antes do período
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(500),
          status: "realizado",
          statusPagamento: "pago",
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-08"), // após
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(500),
          status: "realizado",
          statusPagamento: "pago",
        },
        // dentro
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-03"),
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(100),
          status: "realizado",
          statusPagamento: "pago",
        },
      ],
    });

    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    expect(result.receitaBruta.toFixed(2)).toBe("100.00");
    expect(result.valorRepasse.toFixed(2)).toBe("40.00");
  });

  it("arredondamento bancário (half-up): 100.005 × 1 = 100.01", async () => {
    const { profissional, paciente, consultorio } = await fixturePercentual(1);
    await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal("100.005"),
        status: "realizado",
        statusPagamento: "pago",
      },
    });
    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    // 100.005 × 1.0 = 100.005 → 100.01 (half-up)
    expect(result.valorRepasse.toFixed(2)).toBe("100.01");
  });

  it("contrato sem percentualRepasse → erro", async () => {
    const profissional = await prisma.profissional.create({
      data: {
        nome: "Dr. Sem Percentual",
        especialidade: "Clínica geral",
        conselho: "CRM-SP 999",
        email: "sem@e.com",
        telefone: "11900000010",
        modalidadeContrato: "percentual",
        valorConsultaBase: 200,
        // sem percentualRepasse
        duracaoConsultaMinutos: 30,
      },
    });
    await expect(
      calculateRepasse({
        profissionalId: profissional.id,
        periodoInicio: PERIODO_INICIO,
        periodoFim: PERIODO_FIM,
      }),
    ).rejects.toThrow();
  });
});

describe("calculateRepasse — modalidade aluguel_fixo", () => {
  it("3 atendimentos no mesmo (data, turno) = 1 turno", async () => {
    const { profissional, paciente, consultorio } = await fixtureAluguel(80);
    await prisma.atendimento.createMany({
      data: [
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "08:00",
          valorConsulta: new Prisma.Decimal(150),
          status: "realizado",
          statusPagamento: "pago",
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "09:00",
          valorConsulta: new Prisma.Decimal(150),
          status: "realizado",
          statusPagamento: "pago",
        },
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "11:00",
          valorConsulta: new Prisma.Decimal(150),
          status: "realizado",
          statusPagamento: "pago",
        },
      ],
    });
    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    expect(result.modalidade).toBe("aluguel_fixo");
    expect(result.valorRepasse.toFixed(2)).toBe("80.00"); // 1 turno × 80
    expect(result.atendimentosIds).toHaveLength(3);
  });

  it("2 turnos diferentes mesmo dia = 2 turnos", async () => {
    const { profissional, paciente, consultorio } = await fixtureAluguel(80);
    await prisma.atendimento.createMany({
      data: [
        // manhã
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "10:00",
          valorConsulta: new Prisma.Decimal(150),
          status: "realizado",
          statusPagamento: "pago",
        },
        // tarde
        {
          pacienteId: paciente.id,
          profissionalId: profissional.id,
          consultorioId: consultorio.id,
          data: new Date("2026-06-02"),
          hora: "14:00",
          valorConsulta: new Prisma.Decimal(150),
          status: "realizado",
          statusPagamento: "pago",
        },
      ],
    });
    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    expect(result.valorRepasse.toFixed(2)).toBe("160.00"); // 2 turnos × 80
  });

  it("turno noite (>= 18:00) conta separadamente", async () => {
    const { profissional, paciente, consultorio } = await fixtureAluguel(50);
    await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-03"),
        hora: "19:00",
        valorConsulta: new Prisma.Decimal(100),
        status: "realizado",
        statusPagamento: "pago",
      },
    });
    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    expect(result.valorRepasse.toFixed(2)).toBe("50.00");
  });

  it("aluguel_fixo sem valorAluguelPorTurno → erro", async () => {
    const profissional = await prisma.profissional.create({
      data: {
        nome: "Dr. Sem Aluguel",
        especialidade: "Clínica geral",
        conselho: "CRM-SP 998",
        email: "saluguel@e.com",
        telefone: "11900000099",
        modalidadeContrato: "aluguel_fixo",
        valorConsultaBase: 200,
        // sem valorAluguelPorTurno
        duracaoConsultaMinutos: 30,
      },
    });
    await expect(
      calculateRepasse({
        profissionalId: profissional.id,
        periodoInicio: PERIODO_INICIO,
        periodoFim: PERIODO_FIM,
      }),
    ).rejects.toThrow();
  });

  it("atendimento gratuito ainda conta o turno (turno é uso da sala)", async () => {
    const { profissional, paciente, consultorio } = await fixtureAluguel(80);
    await prisma.atendimento.create({
      data: {
        pacienteId: paciente.id,
        profissionalId: profissional.id,
        consultorioId: consultorio.id,
        data: new Date("2026-06-02"),
        hora: "10:00",
        valorConsulta: new Prisma.Decimal(0),
        status: "realizado",
        statusPagamento: "gratuito",
        motivoDescontoOuGratuidade: "Cortesia",
      },
    });
    const result = await calculateRepasse({
      profissionalId: profissional.id,
      periodoInicio: PERIODO_INICIO,
      periodoFim: PERIODO_FIM,
    });
    // No aluguel-fixo, o que importa é o uso do consultório, não o pagamento
    expect(result.valorRepasse.toFixed(2)).toBe("80.00");
  });
});

describe("calculateRepasse — profissional não encontrado", () => {
  it("lança NaoEncontrado", async () => {
    await expect(
      calculateRepasse({
        profissionalId: "nonexistent-id",
        periodoInicio: PERIODO_INICIO,
        periodoFim: PERIODO_FIM,
      }),
    ).rejects.toThrow();
  });
});
