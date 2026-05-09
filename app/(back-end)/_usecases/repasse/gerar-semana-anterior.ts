import { prisma } from "@/lib/db";
import { gerarRepasse } from "./gerar";

interface Resultado {
  periodoInicio: string;
  periodoFim: string;
  geradosOuExistentes: number;
  detalhes: Array<{
    profissionalId: string;
    profissionalNome: string;
    repasseId: string;
    valorRepasse: string;
    criado: boolean;
  }>;
}

function isoDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Calcula o período da semana anterior (segunda → domingo) relativo a `referencia`.
 * Convenção: semana começa na segunda. Se hoje é segunda, a "semana anterior" é
 * a que terminou ontem (domingo).
 */
export function semanaAnteriorPara(referencia: Date): {
  inicio: string;
  fim: string;
} {
  const ref = new Date(referencia);
  ref.setHours(0, 0, 0, 0);
  const dow = ref.getDay(); // 0=Dom .. 6=Sáb
  // Distância até a segunda-feira da semana CORRENTE (de `ref`)
  const ateSegundaCorrente = dow === 0 ? -6 : 1 - dow;
  const segundaCorrente = new Date(ref);
  segundaCorrente.setDate(ref.getDate() + ateSegundaCorrente);
  // Segunda da semana anterior = segundaCorrente - 7 dias
  const segundaAnterior = new Date(segundaCorrente);
  segundaAnterior.setDate(segundaCorrente.getDate() - 7);
  const domingoAnterior = new Date(segundaAnterior);
  domingoAnterior.setDate(segundaAnterior.getDate() + 6);
  return { inicio: isoDate(segundaAnterior), fim: isoDate(domingoAnterior) };
}

/**
 * Gera o `Repasse` da semana anterior para todos os profissionais ativos.
 * Idempotente: `gerarRepasse` retorna o registro existente se já houver
 * `Repasse` no período (constraint @@unique). Útil para um agendador semanal
 * que pode disparar mais de uma vez sem efeito colateral.
 */
export async function gerarRepassesSemanaAnterior(
  referencia: Date = new Date(),
): Promise<Resultado> {
  const { inicio, fim } = semanaAnteriorPara(referencia);

  const profissionais = await prisma.profissional.findMany({
    where: { ativo: true },
    select: { id: true, nome: true },
  });

  const detalhes: Resultado["detalhes"] = [];
  for (const p of profissionais) {
    const existing = await prisma.repasse.findUnique({
      where: {
        profissionalId_periodoInicio_periodoFim: {
          profissionalId: p.id,
          periodoInicio: new Date(inicio),
          periodoFim: new Date(fim),
        },
      },
      select: { id: true },
    });
    const repasse = await gerarRepasse({
      profissionalId: p.id,
      periodoInicio: inicio,
      periodoFim: fim,
    });
    detalhes.push({
      profissionalId: p.id,
      profissionalNome: p.nome,
      repasseId: repasse.id,
      valorRepasse: String(repasse.valorRepasse),
      criado: !existing,
    });
  }

  return {
    periodoInicio: inicio,
    periodoFim: fim,
    geradosOuExistentes: detalhes.length,
    detalhes,
  };
}
