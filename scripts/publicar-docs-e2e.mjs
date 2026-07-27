/**
 * Publica a documentação funcional em vídeo:
 *
 *   docs/videos/02-paciente-agenda-consulta.mp4     (sem hash no nome)
 *   docs/traces/02-paciente-agenda-consulta.zip
 *   docs/e2e-walkthrough.md                          (índice + cobertura)
 *
 * O índice NÃO é escrito à mão: persona, objetivo, IDs, pré-condições, passos e
 * resultado saem do anexo `jornada-meta` que o próprio narrador publica em
 * tempo de execução. Assim o documento não consegue descrever um vídeo
 * diferente do que foi gravado.
 *
 * Uso: node scripts/publicar-docs-e2e.mjs <relatorio.json>
 */
import {
  readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, rmSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { basename, join } from "node:path";
import { acharFfmpeg, argsMp4 } from "./ffmpeg.mjs";
import { MODULOS, REQUISITOS, CODIGOS } from "./requisitos-planilha.mjs";

const relatorioPath = process.argv[2] ?? ".reports/docs-e2e.json";
const DIR_VIDEOS = "docs/videos";
const DIR_TRACES = "docs/traces";
const INDICE = "docs/e2e-walkthrough.md";

/** [FI09] é o único fora de escopo, por decisão registrada no plano. */
const FORA_DE_ESCOPO = {
  FI09: "REMOVIDO do escopo por DEC-E09 (IMPLEMENTACAO-PLANO.md:621). " +
    "Pagamento é presencial; não existe gateway, checkout nem webhook no código. " +
    "Nenhum vídeo exibe pagamento online.",
};

const relatorio = JSON.parse(readFileSync(relatorioPath, "utf8"));

function* percorrer(suites) {
  for (const s of suites ?? []) {
    for (const spec of s.specs ?? []) {
      for (const teste of spec.tests ?? []) {
        yield { arquivo: s.file ?? spec.file, titulo: spec.title, teste };
      }
    }
    yield* percorrer(s.suites);
  }
}

for (const dir of [DIR_VIDEOS, DIR_TRACES]) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

const FFMPEG = acharFfmpeg();
const EXT = FFMPEG ? "mp4" : "webm";
const jornadas = [];

for (const { arquivo, titulo, teste } of percorrer(relatorio.suites)) {
  // O nome do arquivo de spec É o nome da jornada — sem hash, sem truncagem.
  const slug = basename(arquivo ?? "", ".spec.ts");
  const resultado = teste.results?.[teste.results.length - 1];
  const anexos = resultado?.attachments ?? [];

  const video = anexos.find((a) => a.name === "video" && a.path);
  const trace = anexos.find((a) => a.name === "trace" && a.path);
  const meta = anexos.find((a) => a.name === "jornada-meta");

  let arquivoVideo = null;
  if (video && existsSync(video.path)) {
    arquivoVideo = `${slug}.${EXT}`;
    const destino = join(DIR_VIDEOS, arquivoVideo);
    if (FFMPEG) execFileSync(FFMPEG, argsMp4(video.path, destino));
    else copyFileSync(video.path, destino);
  }

  let arquivoTrace = null;
  if (trace && existsSync(trace.path)) {
    arquivoTrace = `${slug}.zip`;
    copyFileSync(trace.path, join(DIR_TRACES, arquivoTrace));
  }

  let dados = null;
  if (meta?.body) {
    dados = JSON.parse(Buffer.from(meta.body, "base64").toString("utf8"));
  } else if (meta?.path && existsSync(meta.path)) {
    dados = JSON.parse(readFileSync(meta.path, "utf8"));
  }

  jornadas.push({
    slug,
    titulo,
    status: teste.status === "skipped" ? "skipped" : resultado?.status,
    video: arquivoVideo,
    trace: arquivoTrace,
    meta: dados,
  });
}

jornadas.sort((a, b) => a.slug.localeCompare(b.slug, "pt-BR"));

// ---------------------------------------------------------------------------
// Cobertura dos IDs
// ---------------------------------------------------------------------------

const cobertura = new Map(); // id -> [slugs]
for (const j of jornadas) {
  for (const id of j.meta?.ids ?? []) {
    if (!cobertura.has(id)) cobertura.set(id, []);
    cobertura.get(id).push(j.slug);
  }
}
// RF-021 é coberto naturalmente pelo login de toda jornada.
if (!cobertura.has("RF-021")) {
  const comLogin = jornadas.filter((j) =>
    (j.meta?.passos ?? []).some((p) => p.includes("[RF-021]")),
  );
  if (comLogin.length) cobertura.set("RF-021", comLogin.map((j) => j.slug));
}

const nCobertos = CODIGOS.filter((c) => cobertura.has(c)).length;
const nForaEscopo = Object.keys(FORA_DE_ESCOPO).length;
const nVerdes = jornadas.filter((j) => j.status === "passed").length;

// ---------------------------------------------------------------------------
// Índice
// ---------------------------------------------------------------------------

const linhasJornada = jornadas
  .map((j, i) => {
    const m = j.meta;
    const persona = m ? `${m.persona.papel} · ${m.persona.nome}` : "—";
    const ids = (m?.ids ?? []).map((x) => `\`${x}\``).join(" ") || "—";
    const pre = (m?.precondicoes ?? []).join("; ") || "—";
    const video = j.video ? `[assistir](videos/${encodeURI(j.video)})` : "—";
    const trace = j.trace ? `[trace](traces/${encodeURI(j.trace)})` : "—";
    const selo = j.status === "passed" ? "✅" : `⚠️ ${j.status}`;
    return `| ${String(i + 1).padStart(2, "0")} | ${persona} | ${j.titulo} ${selo} | ${ids} | ${m?.objetivo ?? "—"} | ${pre} | ${video} | ${trace} |`;
  })
  .join("\n");

const linhasCobertura = MODULOS.flatMap((mod) => [
  `\n**${mod.nome}**\n`,
  "| ID | Requisito | Situação | Onde |",
  "|---|---|---|---|",
  ...mod.codigos.map((c) => {
    const nome = REQUISITOS[c].nome;
    if (FORA_DE_ESCOPO[c]) {
      return `| \`${c}\` | ${nome} | 🚫 FORA DE ESCOPO | ${FORA_DE_ESCOPO[c]} |`;
    }
    const onde = cobertura.get(c);
    return onde
      ? `| \`${c}\` | ${nome} | ✅ COBERTO | ${onde.map((s) => `\`${s}\``).join(", ")} |`
      : `| \`${c}\` | ${nome} | ❌ NÃO COBERTO | nenhuma jornada declara este ID |`;
  }),
]).join("\n");

const detalhes = jornadas
  .map((j) => {
    const m = j.meta;
    if (!m) return `### ${j.slug}\n\n_Sem metadados: a jornada não chegou ao encerramento._\n`;
    return `### ${j.slug}

**${m.persona.papel} · ${m.persona.nome}** — ${m.objetivo}

IDs: ${m.ids.map((x) => `\`${x}\``).join(" ")}

Pré-condições:
${m.precondicoes.map((p) => `- ${p}`).join("\n")}

Passos narrados:
${m.passos.map((p, i) => `${i + 1}. ${p}`).join("\n")}

**Resultado:** ${m.resultado ?? "—"}
`;
  })
  .join("\n---\n\n");

writeFileSync(
  INDICE,
  `# ClinicaShare — documentação funcional em vídeo

Cada vídeo é uma jornada completa de um perfil de usuário, gravada na aplicação
real. Foram feitos para serem assistidos **sem áudio e sem contexto**: a persona
fica identificada no topo o tempo todo, cada passo aparece legendado embaixo, e
o vídeo abre e fecha com um cartão dizendo o objetivo e o resultado.

${nVerdes} de ${jornadas.length} jornadas verdes · ${nCobertos} dos ${CODIGOS.length} requisitos cobertos · ${nForaEscopo} fora de escopo.

> Este arquivo é **gerado** por \`node scripts/publicar-docs-e2e.mjs\`. Persona,
> objetivo, IDs, pré-condições, passos e resultado vêm do que cada jornada
> declarou em tempo de execução — o texto não consegue divergir do vídeo.

## Jornadas

| # | Persona | Jornada | IDs | Objetivo | Pré-condições | Vídeo | Trace |
|---|---|---|---|---|---|---|---|
${linhasJornada}

## Cobertura dos requisitos
${linhasCobertura}

## Detalhamento das jornadas

${detalhes}
`,
);

console.log(`\n${INDICE}`);
console.log(`  ${jornadas.length} jornadas (${nVerdes} verdes)`);
console.log(`  vídeos .${EXT} em ${DIR_VIDEOS}/`);
console.log(`  ${nCobertos}/${CODIGOS.length} requisitos cobertos, ${nForaEscopo} fora de escopo`);
const naoCobertos = CODIGOS.filter((c) => !cobertura.has(c) && !FORA_DE_ESCOPO[c]);
if (naoCobertos.length) console.log(`  NÃO COBERTOS: ${naoCobertos.join(", ")}`);
