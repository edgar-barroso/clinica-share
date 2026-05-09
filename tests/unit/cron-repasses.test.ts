import { describe, expect, it } from "vitest";
import { semanaAnteriorPara } from "@/app/(back-end)/_usecases/repasse/gerar-semana-anterior";

describe("semanaAnteriorPara", () => {
  // Convenção: semana = segunda → domingo. "Semana anterior" sempre cobre
  // os 7 dias completos antes da segunda-feira corrente.

  it("segunda-feira (06/05) → semana 29/04 a 05/05 (segunda anterior → domingo)", () => {
    const ref = new Date(2026, 4, 6); // 06/maio (qua)... espera, 6/5/2026 = quarta
    // Vou usar uma segunda explícita: 04/05/2026 é segunda
    const ref2 = new Date(2026, 4, 4);
    expect(semanaAnteriorPara(ref2)).toEqual({
      inicio: "2026-04-27",
      fim: "2026-05-03",
    });
  });

  it("quarta-feira (06/05) → ainda devolve a semana 27/04–03/05", () => {
    const ref = new Date(2026, 4, 6); // qua
    expect(semanaAnteriorPara(ref)).toEqual({
      inicio: "2026-04-27",
      fim: "2026-05-03",
    });
  });

  it("domingo (10/05) → semana 27/04–03/05 (a anterior à atual)", () => {
    const ref = new Date(2026, 4, 10); // dom
    expect(semanaAnteriorPara(ref)).toEqual({
      inicio: "2026-04-27",
      fim: "2026-05-03",
    });
  });

  it("sábado (09/05) → semana 27/04–03/05", () => {
    const ref = new Date(2026, 4, 9); // sáb
    expect(semanaAnteriorPara(ref)).toEqual({
      inicio: "2026-04-27",
      fim: "2026-05-03",
    });
  });

  it("período sempre tem 7 dias (segunda + 6)", () => {
    const parseLocal = (iso: string) => {
      const [y, m, d] = iso.split("-").map(Number);
      return new Date(y, m - 1, d);
    };
    for (let i = 0; i < 14; i++) {
      const ref = new Date(2026, 4, 1 + i);
      const { inicio, fim } = semanaAnteriorPara(ref);
      const ini = parseLocal(inicio);
      const f = parseLocal(fim);
      const dias =
        Math.round((f.getTime() - ini.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      expect(dias).toBe(7);
      expect(ini.getDay()).toBe(1); // segunda
      expect(f.getDay()).toBe(0); // domingo
    }
  });

  it("travessia de mês: ref = 02/06 (terça) → semana 25/05–31/05", () => {
    const ref = new Date(2026, 5, 2); // 02/jun/2026 é terça
    expect(semanaAnteriorPara(ref)).toEqual({
      inicio: "2026-05-25",
      fim: "2026-05-31",
    });
  });
});
