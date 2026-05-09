/**
 * WhatsApp — fachada genérica para envio de mensagens.
 *
 * Hoje é um STUB que apenas registra a intenção via console e retorna
 * sucesso. A integração real depende da escolha de provedor; quando
 * estiver pronta, basta substituir o corpo de `sendWhatsApp` (e
 * eventualmente importar o SDK) — toda a aplicação já chama esta função.
 *
 * Provedores possíveis (qualquer um funciona):
 * - Twilio (`twilio` no npm) — bom para internacional, custa por mensagem
 * - Meta Cloud API (oficial) — barato em escala, exige conta WhatsApp Business
 * - Z-API (BR) — atendimento simples, não-oficial mas amplamente usado
 *
 * Variáveis de ambiente esperadas (criar em .env quando integrar):
 * - WHATSAPP_PROVIDER: "twilio" | "meta" | "zapi"
 * - WHATSAPP_API_URL: endpoint do provedor
 * - WHATSAPP_API_TOKEN: bearer/token
 * - WHATSAPP_FROM: número (E.164) ou identificador do remetente
 */

const provider = process.env.WHATSAPP_PROVIDER ?? null;
const apiUrl = process.env.WHATSAPP_API_URL ?? null;
const apiToken = process.env.WHATSAPP_API_TOKEN ?? null;
const fromNumber = process.env.WHATSAPP_FROM ?? null;

export interface SendWhatsAppInput {
  /** Número de destino em E.164 (ex: "+5511999990000"). */
  to: string;
  /** Texto da mensagem. */
  message: string;
}

export interface SendWhatsAppResult {
  ok: boolean;
  /** ID retornado pelo provedor, quando integrado. */
  messageId?: string;
  /** Razão de falha (se aplicável). */
  error?: string;
}

/**
 * Normaliza um telefone BR para E.164 — best effort. Aceita formatos
 * comuns ("(11) 99999-9999", "11999990000", "+5511999990000") e
 * retorna sempre com prefixo +55. Se o número já tem código de país,
 * preserva.
 */
export function normalizarTelefone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  return digits.startsWith("+") ? raw : `+${digits}`;
}

/**
 * Envia mensagem WhatsApp. Quando não há provider configurado, loga
 * a intenção e retorna `ok: true` (modo desenvolvimento — facilita
 * testar fluxos sem credenciais reais).
 */
export async function sendWhatsApp(
  input: SendWhatsAppInput,
): Promise<SendWhatsAppResult> {
  const to = normalizarTelefone(input.to);

  if (!provider || !apiUrl || !apiToken) {
    console.info(
      `[whatsapp:stub] WOULD SEND to=${to} message=${JSON.stringify(input.message)}`,
    );
    return { ok: true, messageId: `stub-${Date.now()}` };
  }

  // Quando o user configurar o provider, substituir esse bloco pela
  // chamada real ao SDK/HTTP. Exemplo conceitual:
  //
  //   const resp = await fetch(apiUrl, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //       Authorization: `Bearer ${apiToken}`,
  //     },
  //     body: JSON.stringify({
  //       from: fromNumber,
  //       to,
  //       type: "text",
  //       text: { body: input.message },
  //     }),
  //   });
  //   if (!resp.ok) return { ok: false, error: await resp.text() };
  //   const data = await resp.json();
  //   return { ok: true, messageId: data.id };

  console.warn(
    `[whatsapp] provider=${provider} configurado mas envio real ainda não implementado. from=${fromNumber} to=${to}`,
  );
  return { ok: true, messageId: `pending-${Date.now()}` };
}
