/**
 * Suporte para as telas que usam `components/agenda/monthly-calendar.tsx`
 * (/p/agendar, /agenda/novo e /atendimentos/novo).
 *
 * A etapa de data dessas telas é um CALENDÁRIO MENSAL — não a antiga tira de
 * "14 dias úteis". Cada dia é um `<button>` cujo `aria-label` é o
 * `formatDateLong` da data ("03 de agosto de 2026"). Dias em que o
 * profissional não atende (ou já lotados) ganham sufixo no label e vêm
 * `disabled`, então casar o label EXATO já é prova de que o dia está liberado.
 *
 * Mesma abordagem de `e2e/planilha/agendamento.spec.ts` e `e2e/docs/_support.ts`
 * — aqui ela vive num módulo compartilhado porque mais de um spec da suíte
 * `chromium` precisa dela.
 */
import { expect, type Locator, type Page } from "@playwright/test";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

/** YYYY-MM-DD no fuso local (a coluna é `@db.Date`, sem hora). */
export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Reproduz `formatDateLong` — é o `aria-label` de um dia habilitado. */
export function rotuloDiaCalendario(iso: string): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return `${String(dia).padStart(2, "0")} de ${MESES[mes - 1]} de ${ano}`;
}

/**
 * Navega o calendário até o mês da data alvo e clica no dia.
 * O calendário abre no mês da data já selecionada (ou no mês corrente),
 * então só precisa avançar — e avança sob demanda, sem assumir um número
 * fixo de cliques em "Próximo mês".
 */
export async function escolherDiaNoCalendario(
  page: Page,
  iso: string,
): Promise<void> {
  // Garante que o calendário já montou antes de procurar o dia (as telas
  // renderizam um aviso no lugar dele enquanto o profissional não carregou).
  const proximoMes = page.getByRole("button", { name: "Próximo mês" });
  await expect(proximoMes).toBeVisible();

  const dia = page.getByRole("button", {
    name: rotuloDiaCalendario(iso),
    exact: true,
  });
  for (let i = 0; i < 4 && (await dia.count()) === 0; i++) {
    await proximoMes.click();
    await page.waitForTimeout(250);
  }
  await expect(
    dia,
    `dia ${iso} deveria estar habilitado no calendário`,
  ).toBeVisible();
  await dia.click();
}

/** Botões da grade de horários ainda livres (ocupados vêm `disabled`). */
export function horariosLivres(page: Page): Locator {
  return page
    .getByRole("button", { name: /^\d{2}:\d{2}$/ })
    .and(page.locator("button:not([disabled])"));
}

/** Avança `d` até cair em dia útil (a clínica não opera sáb/dom no MVP). */
export function proximoDiaUtil(d: Date): Date {
  const saida = new Date(d);
  while (saida.getDay() === 0 || saida.getDay() === 6) {
    saida.setDate(saida.getDate() + 1);
  }
  return saida;
}

/**
 * Primeiro dia útil do MÊS SEGUINTE. Mês seguinte de propósito: os fixtures
 * dos specs vivem dentro de poucos dias a partir de hoje, então lá a agenda
 * está vazia e o teste nunca disputa slot com outro caso.
 */
export function primeiroDiaUtilDoMesSeguinte(): string {
  const hoje = new Date();
  const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1, 12);
  return isoLocal(proximoDiaUtil(primeiro));
}
