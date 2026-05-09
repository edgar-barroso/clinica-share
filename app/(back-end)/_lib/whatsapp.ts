/**
 * WhatsApp — fachada genérica para envio de mensagens.
 *
 * Provider implementado: Twilio (via SDK oficial). Outros providers
 * (Meta, Z-API) podem ser adicionados no `switch` abaixo.
 *
 * Sem `WHATSAPP_PROVIDER` configurado, opera em modo dev: loga a
 * intenção e retorna sucesso. Útil em ambiente local sem credenciais.
 *
 * Variáveis de ambiente:
 * - WHATSAPP_PROVIDER: "twilio"
 * - WHATSAPP_FROM: número remetente em E.164 (ex: "+14155238886")
 *   — sandbox Twilio: "+14155238886"
 *   — produção: número WhatsApp Business aprovado pela Meta
 * - TWILIO_ACCOUNT_SID: começa com "AC..."
 * - TWILIO_AUTH_TOKEN: nunca commitar
 */
import twilio from "twilio";
import { env } from "@/lib/env";

export interface SendWhatsAppInput {
  /** Número de destino em E.164 (ex: "+5511999990000"). */
  to: string;
  /** Texto da mensagem. */
  message: string;
}

export interface SendWhatsAppResult {
  ok: boolean;
  /** SID retornado pelo provider. */
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

// Cliente Twilio inicializado lazy — só instancia quando há credenciais.
// Aceita 2 formatos:
//   A) TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN separados
//   B) WHATSAPP_API_TOKEN no formato "ACxxxx:authtoken" (legacy)
let twilioClient: ReturnType<typeof twilio> | null = null;
function getTwilioClient() {
  if (twilioClient) return twilioClient;

  let sid = env.TWILIO_ACCOUNT_SID;
  let token = env.TWILIO_AUTH_TOKEN;

  if ((!sid || !token) && env.WHATSAPP_API_TOKEN?.includes(":")) {
    const parts = env.WHATSAPP_API_TOKEN.split(":");
    sid = sid ?? parts[0];
    token = token ?? parts.slice(1).join(":");
  }

  if (!sid || !token) return null;
  twilioClient = twilio(sid, token);
  return twilioClient;
}

/**
 * Envia mensagem WhatsApp. Sem provider configurado, opera em modo dev
 * (apenas loga a mensagem e retorna sucesso).
 */
export async function sendWhatsApp(
  input: SendWhatsAppInput,
): Promise<SendWhatsAppResult> {
  const to = normalizarTelefone(input.to);

  if (!env.WHATSAPP_PROVIDER) {
    console.info(
      `[whatsapp:dev] WOULD SEND to=${to} message=${JSON.stringify(input.message)}`,
    );
    return { ok: true, messageId: `dev-${Date.now()}` };
  }

  if (env.WHATSAPP_PROVIDER === "twilio") {
    const client = getTwilioClient();
    if (!client || !env.WHATSAPP_FROM) {
      const reason =
        "Twilio configurado mas faltam TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN ou WHATSAPP_FROM";
      console.error(`[whatsapp:twilio] ${reason}`);
      return { ok: false, error: reason };
    }
    try {
      const msg = await client.messages.create({
        from: `whatsapp:${env.WHATSAPP_FROM.replace(/^whatsapp:/, "")}`,
        to: `whatsapp:${to}`,
        body: input.message,
      });
      return { ok: true, messageId: msg.sid };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      console.error(`[whatsapp:twilio] erro ao enviar para ${to}: ${error}`);
      return { ok: false, error };
    }
  }

  const reason = `Provider "${env.WHATSAPP_PROVIDER}" ainda não implementado`;
  console.warn(`[whatsapp] ${reason}`);
  return { ok: false, error: reason };
}
