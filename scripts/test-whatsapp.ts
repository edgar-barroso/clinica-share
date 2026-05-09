/**
 * Script ad-hoc para testar o envio de WhatsApp via Twilio.
 * `npx tsx scripts/test-whatsapp.ts +5588998029216 "mensagem"`
 *
 * Em sandbox Twilio: o número de destino precisa primeiro mandar
 * `join <duas-palavras>` para +14155238886 (palavras no console Twilio).
 */
import "dotenv/config";
import { sendWhatsApp } from "../app/(back-end)/_lib/whatsapp";

async function main() {
  const to = process.argv[2] ?? "+5588998029216";
  const message =
    process.argv[3] ??
    "🧪 Teste ClinicaShare — se você recebeu isto, a API WhatsApp está funcionando.";

  console.log("→ Enviando WhatsApp...");
  console.log(`  to: ${to}`);
  console.log(`  message: ${message}`);
  console.log(
    `  provider: ${process.env.WHATSAPP_PROVIDER ?? "(não configurado)"}`,
  );
  console.log(`  from: ${process.env.WHATSAPP_FROM ?? "(não setado)"}`);

  const result = await sendWhatsApp({ to, message });

  console.log("\n→ Resultado:");
  console.log(JSON.stringify(result, null, 2));

  if (!result.ok) {
    console.error("\n❌ Falha. Possíveis causas:");
    console.error(
      "  - Em sandbox: o número ainda não mandou 'join <palavras>' para +14155238886",
    );
    console.error(
      "  - Credenciais inválidas (TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN)",
    );
    console.error("  - WHATSAPP_FROM não é número WhatsApp aprovado");
    process.exit(1);
  }
  console.log("\n✓ Enviado. SID:", result.messageId);
}

main().catch((err) => {
  console.error("Erro inesperado:", err);
  process.exit(1);
});
