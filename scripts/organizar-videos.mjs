/**
 * Renomeia os vídeos do Playwright para nomes legíveis por requisito da
 * planilha de custos: `videos/<ambiente>/AG01 — descrição.webm`.
 *
 * O Playwright nomeia as pastas com um hash e trunca o título no meio
 * ("planilha-agendamento-Plani-25100-consulta-online-pelo-portal-chromium"),
 * o que é inútil como entregável. Este script lê o relatório JSON, que tem o
 * título completo e o caminho real do anexo de vídeo, e copia com o nome bom.
 *
 * Uso: node scripts/organizar-videos.mjs <relatorio.json> <pasta-destino>
 */
import { readFileSync, mkdirSync, copyFileSync, rmSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const [, , relatorioPath, destino] = process.argv;
if (!relatorioPath || !destino) {
  console.error("uso: node scripts/organizar-videos.mjs <relatorio.json> <destino>");
  process.exit(1);
}

const relatorio = JSON.parse(readFileSync(relatorioPath, "utf8"));

/** Anda na árvore suites/specs/tests do relatório JSON do Playwright. */
function* percorrer(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? []) {
      for (const teste of spec.tests ?? []) {
        yield { titulo: spec.title, teste };
      }
    }
    yield* percorrer(suite.suites);
  }
}

if (existsSync(destino)) rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

const linhas = [];
let copiados = 0;

for (const { titulo, teste } of percorrer(relatorio.suites)) {
  const resultado = teste.results?.[teste.results.length - 1];
  const status = teste.status === "skipped" ? "skipped" : resultado?.status;
  const video = resultado?.attachments?.find((a) => a.name === "video");

  // Título é "AG01 — descrição"; o código vira prefixo do arquivo.
  const codigo = titulo.match(/^([A-Z]{2,3}-?\d{2,3})/)?.[1] ?? "SEM-CODIGO";

  if (video?.path && existsSync(video.path)) {
    const nome = `${titulo.replace(/[/\\:]/g, "-").slice(0, 120)}.webm`;
    copyFileSync(video.path, join(destino, nome));
    copiados++;
    linhas.push(`${codigo}\t${status}\t${nome}`);
  } else {
    linhas.push(`${codigo}\t${status}\t(sem vídeo)`);
  }
}

linhas.sort();
console.log(`\n${copiados} vídeos copiados para ${destino}\n`);
console.log("CÓDIGO\tSTATUS\tARQUIVO");
for (const l of linhas) console.log(l);
