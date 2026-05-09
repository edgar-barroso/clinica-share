import { describe, expect, it } from "vitest";
import { formatDate, formatDateLong } from "@/lib/format";

describe("formatDate (date-only inputs)", () => {
  // Casos que vêm do Prisma `@db.Date` ou de inputs `YYYY-MM-DD` do front.
  // Sem o tratamento explícito, em fusos negativos (BR = UTC-3) o Date
  // construído via `new Date("2026-05-11T00:00:00.000Z")` recua para 10/05.

  it("string YYYY-MM-DD é interpretada como data local (não UTC)", () => {
    expect(formatDate("2026-05-11")).toBe("11/05/2026");
  });

  it("string ISO com T00:00:00.000Z (Prisma @db.Date) preserva o dia local", () => {
    expect(formatDate("2026-05-11T00:00:00.000Z")).toBe("11/05/2026");
  });

  it("string ISO com T00:00:00Z (sem ms) preserva o dia local", () => {
    expect(formatDate("2026-05-11T00:00:00Z")).toBe("11/05/2026");
  });

  it("formatDateLong respeita o dia para datas puras", () => {
    expect(formatDateLong("2026-05-11")).toBe("11 de maio de 2026");
  });

  it("Date object continua usando timezone local nativo", () => {
    const d = new Date(2026, 4, 11); // 11/maio/2026 local
    expect(formatDate(d)).toBe("11/05/2026");
  });

  it("ISO datetime com hora real continua interpretado como timestamp", () => {
    // 11/maio 18:00 UTC = 15:00 em BR. dia 11.
    expect(formatDate("2026-05-11T18:00:00.000Z")).toBe("11/05/2026");
  });
});
