import { defineConfig, devices } from "@playwright/test";

/**
 * Três suítes com objetivos diferentes, por isso três projetos:
 *
 * - `chromium`   — suíte de regressão (CI). Sem vídeo e sem slowMo: velocidade
 *                  é o que importa aqui.
 * - `planilha`   — comprovação por requisito da planilha de custos. Grava vídeo
 *                  de cada requisito nos dois ambientes.
 * - `docs-e2e`   — documentação funcional narrada. Vídeo pensado para alguém
 *                  que nunca viu o sistema assistir sem áudio: mais devagar,
 *                  trace sempre retido.
 *
 * Rodar isolado: `npx playwright test --project=docs-e2e`
 */
const ENV_LABEL = process.env.E2E_ENV ?? "local";
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
const CHROME = devices["Desktop Chrome"];

/** Viewport igual ao tamanho do vídeo — evita reescala e texto borrado. */
const TELA = { width: 1280, height: 720 };

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  timeout: 60_000,
  fullyParallel: false,
  // Specs compartilham o mesmo Postgres e várias fazem beforeAll que limpa
  // tabelas — paralelismo causaria race entre workers
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  // Cada projeto grava na SUA pasta. Compartilhar `outputDir` fazia a suíte
  // rodada depois apagar os vídeos da anterior — o Playwright limpa o
  // diretório de saída no início de cada execução, e as gravações de
  // `planilha` e `docs-e2e` se destruíam mutuamente.
  outputDir: process.env.E2E_OUT_DIR ?? "test-results/ci",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      testDir: "./e2e",
      // As duas suítes de vídeo têm projeto próprio; fora daqui elas só
      // deixariam o CI lento.
      testIgnore: ["**/planilha/**", "**/docs/**"],
      use: { ...CHROME },
    },
    {
      name: "planilha",
      testDir: "./e2e/planilha",
      outputDir: `test-results/planilha-${ENV_LABEL}`,
      use: {
        ...CHROME,
        viewport: TELA,
        video: { mode: "on", size: TELA },
        launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 250) },
      },
    },
    {
      name: "docs-e2e",
      testDir: "./e2e/docs",
      outputDir: "test-results/docs",
      // As jornadas narradas pausam de propósito (1,8s por passo + slowMo 300
      // + 1s por validação) para o vídeo ser legível. Com 60s a jornada mais
      // longa ficava a poucos segundos do limite e estourava sem nada estar
      // errado — o timeout aqui é orçamento de gravação, não de correção.
      timeout: 180_000,
      use: {
        ...CHROME,
        viewport: TELA,
        video: { mode: "on", size: TELA },
        // Mais devagar que a suíte de comprovação: aqui o espectador precisa
        // ler legenda e acompanhar cada interação.
        launchOptions: { slowMo: Number(process.env.E2E_SLOWMO ?? 300) },
        trace: "on",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    // 120s não bastava em máquina fria: o Next sobe e ainda compila cada rota
    // sob demanda, e a suíte inteira era abortada antes do primeiro teste.
    // Para gravar vídeo, prefira subir o dev antes — `reuseExistingServer`
    // aproveita o processo já aquecido e evita timeout no meio da jornada.
    timeout: 300_000,
  },
});
