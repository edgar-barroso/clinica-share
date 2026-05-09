import { describe, expect, it } from "vitest";
import {
  BLOCOS_PADRAO,
  gerarSlots,
  slotConflita,
  toHHMM,
  toMinutes,
} from "@/lib/horarios";

describe("toMinutes / toHHMM", () => {
  it("converte HH:MM para minutos e volta", () => {
    expect(toMinutes("07:00")).toBe(420);
    expect(toMinutes("13:30")).toBe(810);
    expect(toHHMM(420)).toBe("07:00");
    expect(toHHMM(810)).toBe("13:30");
    expect(toHHMM(0)).toBe("00:00");
  });
});

describe("gerarSlots", () => {
  it("duração 30min gera slots a cada 30min em cada bloco", () => {
    const blocos = gerarSlots(BLOCOS_PADRAO, 30);
    expect(blocos.map((b) => b.periodo)).toEqual([
      "Manhã",
      "Tarde",
      "Noite",
    ]);
    // Manhã 07:00–12:00 com passo 30min → 10 slots
    expect(blocos[0].slots).toEqual([
      "07:00",
      "07:30",
      "08:00",
      "08:30",
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
    ]);
    // Não inclui 12:00 (fim do bloco; o slot 12:00 terminaria 12:30 fora)
    expect(blocos[0].slots).not.toContain("12:00");
  });

  it("duração 60min gera slots espaçados de 1h", () => {
    const blocos = gerarSlots(BLOCOS_PADRAO, 60);
    expect(blocos[0].slots).toEqual([
      "07:00",
      "08:00",
      "09:00",
      "10:00",
      "11:00",
    ]);
    // Tarde: 13:00–18:00 → 13,14,15,16,17 (17:00 termina 18:00, OK)
    expect(blocos[1].slots).toEqual([
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
    ]);
  });

  it("duração 45min descarta slots que não cabem inteiros no bloco", () => {
    const blocos = gerarSlots(BLOCOS_PADRAO, 45);
    // Manhã 07:00–12:00 (300 min) com passo 45min: 07:00, 07:45,
    // 08:30, 09:15, 10:00, 10:45 — 11:30+45=12:15 NÃO cabe
    expect(blocos[0].slots).toEqual([
      "07:00",
      "07:45",
      "08:30",
      "09:15",
      "10:00",
      "10:45",
    ]);
  });

  it("duração 90min na Noite (18-20) só tem 1 slot que não termina antes do fim — descartado pra noite curta", () => {
    const blocos = gerarSlots(BLOCOS_PADRAO, 90);
    // Noite 18:00-20:00 (120 min): 18:00 (termina 19:30 OK)
    const noite = blocos.find((b) => b.periodo === "Noite");
    expect(noite?.slots).toEqual(["18:00"]);
  });

  it("filtra blocos vazios (duração maior que o intervalo)", () => {
    const blocos = gerarSlots(BLOCOS_PADRAO, 240); // 4h
    // Manhã (300min): 07:00 termina 11:00 OK → ainda 1 slot
    // Tarde (300min): 13:00 termina 17:00 OK → ainda 1 slot
    // Noite (120min): 4h não cabe → bloco filtrado
    expect(blocos.map((b) => b.periodo)).toEqual(["Manhã", "Tarde"]);
  });

  it("duração 0 ou negativa retorna lista vazia", () => {
    expect(gerarSlots(BLOCOS_PADRAO, 0)).toEqual([]);
    expect(gerarSlots(BLOCOS_PADRAO, -30)).toEqual([]);
  });
});

describe("slotConflita", () => {
  it("detecta conflito exato", () => {
    expect(slotConflita("08:00", ["08:00"], 30)).toBe(true);
  });

  it("detecta sobreposição parcial (consulta 60min em 08:00 bloqueia 08:30)", () => {
    expect(slotConflita("08:30", ["08:00"], 60)).toBe(true);
  });

  it("não conflita quando o slot termina exatamente no início do ocupado", () => {
    // 07:30 + 30min = 08:00. 08:00 está ocupado mas começa onde o anterior termina.
    expect(slotConflita("07:30", ["08:00"], 30)).toBe(false);
  });

  it("conflita 09:30 com consulta 60min em 09:00 (09:00-10:00 vs 09:30-10:30)", () => {
    expect(slotConflita("09:30", ["09:00"], 60)).toBe(true);
  });

  it("não conflita slots distantes", () => {
    expect(slotConflita("10:00", ["08:00", "14:00"], 30)).toBe(false);
  });

  it("retorna false quando ocupados está vazio", () => {
    expect(slotConflita("10:00", [], 30)).toBe(false);
  });
});
