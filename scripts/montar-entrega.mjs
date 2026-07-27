/**
 * Monta a pasta de entrega final: vídeos agrupados por módulo da planilha de
 * custos, convertidos para MP4 e nomeados com o texto oficial do requisito,
 * mais o PDF e um LEIA-ME.
 *
 * Diferente de `organizar-videos.mjs`, que só desfaz os nomes com hash do
 * Playwright, este script produz o pacote que vai para o cliente:
 *
 *   Entrega-ClinicaShare/
 *     LEIA-ME.md
 *     ClinicaShare — Comprovacao de Requisitos.pdf
 *     1 - Agendamento/
 *       AG01 — Paciente agenda consulta online (portal web) — LOCAL.mp4
 *       AG01 — Paciente agenda consulta online (portal web) — PRODUCAO.mp4
 *       ...
 *
 * Os dois ambientes ficam lado a lado de propósito: assim dá para conferir
 * o mesmo requisito nos dois bancos sem trocar de pasta.
 *
 * MP4/H.264 porque o Playwright grava em WebM, que o QuickTime do macOS não
 * abre — o cliente precisa conseguir dar duplo clique. O ffmpeg embutido do
 * Playwright não serve (build reduzido, sem muxer MP4).
 *
 * Uso: node scripts/montar-entrega.mjs
 */
import {
  readFileSync, existsSync, mkdirSync, copyFileSync, writeFileSync,
  rmSync, readdirSync, statSync,
} from "node:fs";
import { execFile, execFileSync } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { MODULOS, REQUISITOS, CODIGOS, nomeSeguro } from "./requisitos-planilha.mjs";

const execFileAsync = promisify(execFile);

const DESTINO = "Entrega-ClinicaShare";
const PDF = "videos/ClinicaShare — Comprovacao de Requisitos.pdf";
const RELATORIOS = { LOCAL: ".reports/local.json", PRODUCAO: ".reports/producao.json" };
const ORIGENS = { LOCAL: "videos/local", PRODUCAO: "videos/producao" };
/** Quantas conversões simultâneas. Acima disso o ganho some e a máquina trava. */
const PARALELAS = 4;

// --- ffmpeg ----------------------------------------------------------------

/**
 * Acha um ffmpeg com H.264. Ordem: variável de ambiente, PATH do sistema e,
 * por último, o binário estático do pacote python `imageio-ffmpeg`.
 * Retorna null se não houver nenhum — aí a entrega sai em WebM mesmo.
 */
function acharFfmpeg() {
  if (process.env.FFMPEG && existsSync(process.env.FFMPEG)) return process.env.FFMPEG;
  for (const tentativa of [
    () => execFileSync("which", ["ffmpeg"], { encoding: "utf8" }).trim(),
    () =>
      execFileSync(
        "python3",
        ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"],
        { encoding: "utf8" },
      ).trim(),
  ]) {
    try {
      const caminho = tentativa();
      if (caminho && existsSync(caminho)) return caminho;
    } catch {
      // segue para a próxima estratégia
    }
  }
  return null;
}

const FFMPEG = acharFfmpeg();

async function converter(origem, destino) {
  // crf 26 mantém texto de tabela financeira legível a 1280x720 e ainda sai
  // menor que o WebM original; faststart deixa o vídeo tocar sem baixar tudo.
  await execFileAsync(FFMPEG, [
    "-y", "-loglevel", "error",
    "-i", origem,
    "-c:v", "libx264", "-preset", "medium", "-crf", "26",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    "-an",
    destino,
  ]);
}

// --- resultados reais, para o LEIA-ME não poder divergir do que rodou -------

function lerResultados(caminho) {
  if (!existsSync(caminho)) return {};
  const rel = JSON.parse(readFileSync(caminho, "utf8"));
  const mapa = {};
  (function percorrer(suites) {
    for (const s of suites ?? []) {
      for (const sp of s.specs ?? []) {
        for (const t of sp.tests ?? []) {
          const codigo = sp.title.match(/^([A-Z]{2,3}-?\d{2,3})/)?.[1];
          if (codigo) {
            mapa[codigo] = {
              status: t.status === "skipped" ? "skipped" : t.results?.at(-1)?.status,
              titulo: sp.title,
            };
          }
        }
      }
      percorrer(s.suites);
    }
  })(rel.suites);
  return mapa;
}

const resultados = {
  LOCAL: lerResultados(RELATORIOS.LOCAL),
  PRODUCAO: lerResultados(RELATORIOS.PRODUCAO),
};

/** Acha o .webm de um requisito na pasta de origem pelo prefixo do código. */
function acharVideo(pasta, codigo) {
  if (!existsSync(pasta)) return null;
  const alvo = readdirSync(pasta).find(
    (f) => f.endsWith(".webm") && f.startsWith(`${codigo} `),
  );
  return alvo ? join(pasta, alvo) : null;
}

// --- monta -----------------------------------------------------------------

if (existsSync(DESTINO)) rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });

const extensao = FFMPEG ? "mp4" : "webm";
if (!FFMPEG) {
  console.warn(
    "AVISO: nenhum ffmpeg com H.264 encontrado — a entrega vai sair em WebM.\n" +
      "       Instale com `brew install ffmpeg` ou `pip install imageio-ffmpeg`.",
  );
}

const tarefas = [];
const semVideo = [];
const linhasIndice = [];

for (const modulo of MODULOS) {
  const pastaModulo = join(DESTINO, modulo.pasta);
  mkdirSync(pastaModulo, { recursive: true });
  linhasIndice.push(`\n### ${modulo.nome}\n`);
  linhasIndice.push("| Código | Requisito | Local | Produção |");
  linhasIndice.push("|---|---|---|---|");

  for (const codigo of modulo.codigos) {
    const req = REQUISITOS[codigo];
    const base = `${codigo} — ${nomeSeguro(req.nome)}`;
    const marca = {};

    for (const ambiente of ["LOCAL", "PRODUCAO"]) {
      const origem = acharVideo(ORIGENS[ambiente], codigo);
      const status = resultados[ambiente][codigo]?.status;
      if (origem) {
        tarefas.push({
          origem,
          destino: join(pastaModulo, `${base} — ${ambiente}.${extensao}`),
        });
        marca[ambiente] = status === "passed" ? "✅ passou" : `⚠️ ${status ?? "?"}`;
      } else {
        marca[ambiente] = status === "skipped" ? "— sem vídeo" : "— ausente";
      }
    }

    if (!acharVideo(ORIGENS.LOCAL, codigo)) semVideo.push(codigo);
    linhasIndice.push(`| \`${codigo}\` | ${req.nome} | ${marca.LOCAL} | ${marca.PRODUCAO} |`);
  }
}

// Converte (ou copia) com um pool simples, para não abrir 66 processos de uma vez.
let feitos = 0;
let bytesAntes = 0;
let bytesDepois = 0;

async function trabalhar(fila) {
  for (;;) {
    const tarefa = fila.shift();
    if (!tarefa) return;
    bytesAntes += statSync(tarefa.origem).size;
    if (FFMPEG) await converter(tarefa.origem, tarefa.destino);
    else copyFileSync(tarefa.origem, tarefa.destino);
    bytesDepois += statSync(tarefa.destino).size;
    feitos++;
    process.stdout.write(`\r  ${feitos}/${tarefas.length} vídeos processados`);
  }
}

const fila = [...tarefas];
console.log(
  FFMPEG
    ? `Convertendo ${tarefas.length} vídeos para MP4 (${PARALELAS} em paralelo)...`
    : `Copiando ${tarefas.length} vídeos...`,
);
await Promise.all(Array.from({ length: PARALELAS }, () => trabalhar(fila)));
process.stdout.write("\n");

// FI09 não tem vídeo — em vez de deixar um buraco silencioso na pasta do
// módulo financeiro, deixa um aviso explicando por quê.
if (semVideo.includes("FI09")) {
  const pastaFin = MODULOS.find((m) => m.codigos.includes("FI09")).pasta;
  writeFileSync(
    join(DESTINO, pastaFin, "FI09 — SEM VIDEO — leia.txt"),
    [
      "FI09 — Pagamento online pelo paciente: Pix, cartão",
      "",
      "Este requisito NÃO tem vídeo, e isso é intencional.",
      "",
      "Motivo: está formalmente fora do escopo do projeto. O arquivo",
      "IMPLEMENTACAO-PLANO.md registra:",
      '  linha 621: "| FI09 | ~~Pagamento online~~ | REMOVIDO (DEC-E09) |"',
      '  linha 385: "FI09 (pagamento online) NÃO implementado (DEC-E09)"',
      "",
      "A decisão DEC-E09 define pagamento exclusivamente presencial, pendente",
      "de confirmação do Dr. Edson na R2. Não existe gateway, checkout, webhook",
      "nem tabela de transação no código.",
      "",
      "Optou-se por declarar a ausência em vez de gravar um checkout simulado,",
      "que seria uma comprovação falsa de algo que não existe.",
      "",
      "Detalhes no capítulo FI09 do PDF de comprovação.",
      "",
    ].join("\n"),
  );
}

if (existsSync(PDF)) copyFileSync(PDF, join(DESTINO, PDF.split("/").pop()));

const nOk = CODIGOS.filter((c) => resultados.LOCAL[c]?.status === "passed").length;
const mb = (b) => `${(b / 1024 / 1024).toFixed(0)} MB`;

writeFileSync(
  join(DESTINO, "LEIA-ME.md"),
  `# ClinicaShare — comprovação em vídeo da planilha de custos

${nOk} dos ${CODIGOS.length} requisitos da planilha têm vídeo, gravado em **dois
ambientes**: banco local (PostgreSQL em Docker) e produção (Neon).

## Como está organizado

Uma pasta por módulo da planilha. Dentro, dois arquivos por requisito —
\`… — LOCAL.${extensao}\` e \`… — PRODUCAO.${extensao}\` — lado a lado, para conferir o
mesmo requisito nos dois bancos sem trocar de pasta. Os nomes são o texto
oficial da coluna "Macro Requisitos (Casos de Uso)" da planilha.

Os vídeos são **MP4 (H.264)**, 1280×720, com as ações desaceleradas para dar
para acompanhar. Abrem com duplo clique no QuickTime, e em qualquer navegador
ou player.

## Antes de assistir

Leia o **PDF de comprovação** nesta pasta. Ele tem um capítulo por requisito
dizendo o que acontece no vídeo, como aquilo comprova o requisito, e — quando
é o caso — onde a implementação ainda fica aquém do enunciado. Os resultados
do PDF vêm dos relatórios de execução reais, não foram digitados à mão.

## A exceção

**FI09 (pagamento online por Pix e cartão) não tem vídeo.** Está removido do
escopo pela decisão DEC-E09 registrada no plano do projeto e não existe gateway
de pagamento no código. Há um aviso na pasta do módulo Financeiro explicando.

## Índice
${linhasIndice.join("\n")}
`,
);

console.log(`\nPasta de entrega: ${DESTINO}/`);
console.log(`  ${feitos} vídeos .${extensao} em ${MODULOS.length} pastas de módulo`);
console.log(`  ${nOk}/${CODIGOS.length} requisitos com vídeo aprovado`);
if (FFMPEG) console.log(`  tamanho: ${mb(bytesAntes)} (WebM) -> ${mb(bytesDepois)} (MP4)`);
if (semVideo.length) console.log(`  sem vídeo: ${semVideo.join(", ")}`);
