/**
 * Narrador dos vídeos de documentação funcional do ClinicaShare.
 *
 * Os vídeos são assistidos SEM ÁUDIO e SEM CONTEXTO por alguém que nunca viu o
 * sistema. Só a gravação da tela não responde às quatro perguntas do teste do
 * observador (quem age, o que quer, em que passo está, se deu certo), então
 * tudo isso é desenhado por cima da página.
 *
 * Ligado por FIXTURE: os specs importam `test` daqui e recebem `jornada`
 * pronta. A lógica de narração fica toda neste arquivo — os specs só declaram
 * o que está acontecendo em linguagem de negócio.
 *
 * A sobreposição é injetada no DOM da própria página (é o que o vídeo captura),
 * com `pointer-events: none` para nunca interceptar clique do teste, e é
 * reinjetada a cada navegação — inclusive nas transições client-side do Next,
 * que trocam o corpo da página sem disparar `load`.
 */
import {
  test as base,
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";

export { expect };

/** Papéis do RF-022, como aparecem para quem assiste. */
export type Papel =
  | "ADMINISTRADOR"
  | "AUXILIAR"
  | "PROFISSIONAL"
  | "ATENDENTE"
  | "PACIENTE"
  | "SISTEMA";

export interface Persona {
  papel: Papel;
  nome: string;
}

export interface AberturaJornada {
  persona: Persona;
  /** Objetivo em uma frase, na voz do negócio. */
  objetivo: string;
  /** IDs de caso de uso cobertos, ex: ["AG01"] */
  ids: string[];
  /** O que já existia antes do vídeo começar. */
  precondicoes: string[];
}

const ID_RAIZ = "__narrador__";
const COR = {
  ADMINISTRADOR: "#1d4ed8",
  AUXILIAR: "#7c3aed",
  PROFISSIONAL: "#047857",
  ATENDENTE: "#b45309",
  PACIENTE: "#be123c",
  SISTEMA: "#334155",
} satisfies Record<Papel, string>;

/** Pausa mínima exigida para o texto ser legível em vídeo. */
const PAUSA_LEGENDA = 1200;
const PAUSA_VALIDACAO = 1000;
const DURACAO_ABERTURA = 3000;
const DURACAO_ENCERRAMENTO = 2000;
const DURACAO_TRANSICAO = 2500;

export class Narrador {
  private persona: Persona | null = null;
  private passoAtual = 0;
  private ligado = false;
  private abertura: AberturaJornada | null = null;
  private readonly passos: string[] = [];

  constructor(
    private readonly page: Page,
    private readonly testInfo: TestInfo,
  ) {}

  /**
   * Publica os metadados da jornada como anexo do teste. O índice
   * `docs/e2e-walkthrough.md` é gerado a partir daqui, então ele não consegue
   * divergir do que o vídeo de fato narrou.
   */
  private async publicarMeta(resultado?: string): Promise<void> {
    if (!this.abertura) return;
    await this.testInfo.attach("jornada-meta", {
      contentType: "application/json",
      body: JSON.stringify({
        persona: this.abertura.persona,
        objetivo: this.abertura.objetivo,
        ids: this.abertura.ids,
        precondicoes: this.abertura.precondicoes,
        passos: this.passos,
        resultado: resultado ?? null,
      }),
    });
  }

  // -------------------------------------------------------------------------
  // Sobreposição
  // -------------------------------------------------------------------------

  /**
   * Injeta (ou reinjeta) badge e legenda. Idempotente: se já existem, só
   * atualiza o texto. Chamado antes de cada narração porque a navegação
   * client-side do Next recria o body e leva a sobreposição junto.
   */
  private async garantirOverlay(legenda?: string): Promise<void> {
    if (!this.persona) return;
    await this.page.evaluate(
      ({ raiz, papel, nome, cor, legenda }) => {
        // SHADOW DOM FECHADO, de propósito: a legenda repete textos que estão
        // na página (nome de paciente, motivo, valor). Se ela morasse no DOM
        // normal, todo `getByText` do teste casaria duas vezes e o Playwright
        // abortaria por strict mode. Um shadow root fechado não é perfurado
        // pelos seletores, mas continua sendo renderizado — ou seja, some para
        // o teste e permanece no vídeo, que é exatamente o que queremos.
        const w = window as unknown as { __narradorRoot?: ShadowRoot };
        let host = document.getElementById(raiz);
        let root = w.__narradorRoot;
        if (!host || !host.isConnected || !root) {
          host?.remove();
          host = document.createElement("div");
          host.id = raiz;
          host.setAttribute("aria-hidden", "true");
          host.style.cssText =
            "position:fixed;inset:0;z-index:2147483647;pointer-events:none";
          document.body.appendChild(host);
          root = host.attachShadow({ mode: "closed" });
          w.__narradorRoot = root;
          root.innerHTML =
            '<div id="badge"></div><div id="cap"></div><div id="cartao"></div>';
        }
        const badge = root.querySelector("#badge") as HTMLElement;
        badge.style.cssText =
          "position:absolute;top:0;left:0;right:0;height:38px;display:flex;" +
          "align-items:center;gap:10px;padding:0 16px;color:#fff;font-size:14px;" +
          "font-weight:600;letter-spacing:.3px;background:" + cor +
          ";box-shadow:0 2px 8px rgba(0,0,0,.25);" +
          "font-family:-apple-system,Segoe UI,Roboto,sans-serif";
        badge.innerHTML =
          '<span style="background:rgba(255,255,255,.22);padding:2px 9px;' +
          'border-radius:20px;font-size:11px;letter-spacing:1px">' + papel +
          "</span><span>" + nome + "</span>";

        const cap = root.querySelector("#cap") as HTMLElement;
        if (legenda) {
          cap.style.cssText =
            "position:absolute;left:50%;transform:translateX(-50%);bottom:22px;" +
            "max-width:78%;padding:12px 22px;border-radius:10px;" +
            "background:rgba(15,23,42,.93);color:#fff;font-size:16px;" +
            "line-height:1.45;text-align:center;box-shadow:0 6px 24px rgba(0,0,0,.35);" +
            "font-family:-apple-system,Segoe UI,Roboto,sans-serif";
          cap.textContent = legenda;
        } else {
          cap.style.cssText = "display:none";
        }
      },
      {
        raiz: ID_RAIZ,
        papel: this.persona.papel,
        nome: this.persona.nome,
        cor: COR[this.persona.papel],
        legenda: legenda ?? "",
      },
    );
  }

  /** Reinjeta a sobreposição sempre que a página navega. */
  private ligarReinjecao(): void {
    if (this.ligado) return;
    this.ligado = true;
    this.page.on("domcontentloaded", () => {
      void this.garantirOverlay().catch(() => {
        /* navegação em voo — a próxima narração reinjeta */
      });
    });
  }

  /**
   * Cartão que ocupa a tela inteira (aberturas, transições e encerramento).
   * Vai dentro do mesmo shadow root fechado, pelo mesmo motivo do overlay:
   * o texto do cartão repete dados da página e envenenaria os seletores.
   */
  private async cartao(
    html: string,
    duracaoMs: number,
    cor: string,
  ): Promise<void> {
    await this.garantirOverlay();
    await this.page.evaluate(
      ({ conteudo, cor }) => {
        const w = window as unknown as { __narradorRoot?: ShadowRoot };
        const el = w.__narradorRoot?.querySelector("#cartao") as HTMLElement | null;
        if (!el) return;
        el.style.cssText =
          "position:absolute;inset:0;display:flex;flex-direction:column;" +
          "align-items:center;justify-content:center;gap:14px;padding:8vh 12vw;" +
          "text-align:center;color:#fff;background:" + cor + ";" +
          "font-family:-apple-system,Segoe UI,Roboto,sans-serif";
        el.innerHTML = conteudo;
      },
      { conteudo: html, cor },
    );
    await this.page.waitForTimeout(duracaoMs);
    await this.page.evaluate(() => {
      const w = window as unknown as { __narradorRoot?: ShadowRoot };
      const el = w.__narradorRoot?.querySelector("#cartao") as HTMLElement | null;
      if (el) {
        el.style.cssText = "display:none";
        el.innerHTML = "";
      }
    });
  }

  // -------------------------------------------------------------------------
  // API usada pelos specs
  // -------------------------------------------------------------------------

  /**
   * Cartão de abertura: quem é a persona, o que ela quer, quais IDs o vídeo
   * cobre e o que já existia antes. Responde às perguntas 1 e 2 do observador.
   */
  async abrir(info: AberturaJornada): Promise<void> {
    this.persona = info.persona;
    this.passoAtual = 0;
    this.abertura = info;
    this.ligarReinjecao();

    const pre = info.precondicoes
      .map((p) => `<li style="margin:2px 0">${p}</li>`)
      .join("");
    await this.cartao(
      `<div style="font-size:13px;letter-spacing:2px;opacity:.75">
         ${info.persona.papel}
       </div>
       <div style="font-size:34px;font-weight:700;line-height:1.2">
         ${info.persona.nome}
       </div>
       <div style="font-size:21px;line-height:1.4;max-width:44ch;opacity:.95">
         ${info.objetivo}
       </div>
       <div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap;justify-content:center">
         ${info.ids
           .map(
             (id) =>
               `<span style="border:1px solid rgba(255,255,255,.5);border-radius:20px;
                 padding:3px 12px;font-size:13px;font-weight:600">${id}</span>`,
           )
           .join("")}
       </div>
       <div style="margin-top:14px;font-size:13px;opacity:.8;text-align:left">
         <div style="text-transform:uppercase;letter-spacing:1.5px;margin-bottom:4px">
           Já existe antes deste vídeo
         </div>
         <ul style="margin:0;padding-left:18px">${pre}</ul>
       </div>`,
      DURACAO_ABERTURA,
      COR[info.persona.papel],
    );
    await this.garantirOverlay();
  }

  /**
   * Um passo da jornada. O nome DEVE citar o ID coberto e estar em linguagem
   * de negócio — é ele que vira a legenda do vídeo e o nome no relatório.
   */
  async passo(nome: string, corpo: () => Promise<void>): Promise<void> {
    this.passoAtual += 1;
    const numerado = `${this.passoAtual}. ${nome}`;
    this.passos.push(nome);
    await base.step(nome, async () => {
      await this.garantirOverlay(numerado);
      await this.page.waitForTimeout(PAUSA_LEGENDA);
      await corpo();
    });
  }

  /**
   * Destaca o elemento que comprova o resultado e segura por 1s.
   * Responde à pergunta 4 do observador ("deu certo?").
   */
  async validar(alvo: Locator, texto?: string): Promise<void> {
    await expect(alvo).toBeVisible();
    if (texto) await this.garantirOverlay(texto);
    await alvo.evaluate((el) => {
      const e = el as HTMLElement;
      e.dataset.narradorOutline = e.style.outline;
      e.style.outline = "3px solid #16a34a";
      e.style.outlineOffset = "3px";
      e.style.borderRadius = "6px";
      e.scrollIntoView({ block: "center", behavior: "instant" as ScrollBehavior });
    });
    await this.page.waitForTimeout(PAUSA_VALIDACAO);
    await alvo.evaluate((el) => {
      const e = el as HTMLElement;
      e.style.outline = e.dataset.narradorOutline ?? "";
    });
  }

  /**
   * Troca de papel dentro do mesmo vídeo. O logout e o novo login continuam
   * sendo feitos pela UI real no spec — este cartão só avisa quem assiste que
   * o ponto de vista mudou.
   */
  async trocarPersona(nova: Persona, motivo: string): Promise<void> {
    await this.cartao(
      `<div style="font-size:15px;letter-spacing:2px;opacity:.8">AGORA O MESMO CASO PELO OLHAR DE</div>
       <div style="font-size:32px;font-weight:700">${nova.papel} · ${nova.nome}</div>
       <div style="font-size:19px;opacity:.9;max-width:42ch">${motivo}</div>`,
      DURACAO_TRANSICAO,
      COR[nova.papel],
    );
    this.persona = nova;
    await this.garantirOverlay();
  }

  /** Cartão final: o resultado concreto, escrito por extenso. */
  async encerrar(resultado: string): Promise<void> {
    await this.cartao(
      `<div style="font-size:46px">✓</div>
       <div style="font-size:15px;letter-spacing:2px;opacity:.8">RESULTADO CONFIRMADO</div>
       <div style="font-size:24px;font-weight:600;line-height:1.4;max-width:40ch">
         ${resultado}
       </div>`,
      DURACAO_ENCERRAMENTO,
      "#166534",
    );
    await this.publicarMeta(resultado);
  }
}

/**
 * Fixture. Os specs de documentação importam `test` e `expect` daqui;
 * `jornada` já vem ligada à página do teste.
 */
export const test = base.extend<{ jornada: Narrador }>({
  jornada: async ({ page }, use, testInfo) => {
    await use(new Narrador(page, testInfo));
  },
});
