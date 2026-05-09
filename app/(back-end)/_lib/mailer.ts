import nodemailer from "nodemailer";
import { env } from "@/lib/env";

export const mailer = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_SERVICE_USER_EMAIL,
    pass: env.EMAIL_SERVICE_USER_PASSWORD,
  },
});

export async function sendResetPasswordEmail(params: {
  to: string;
  userName: string;
  token: string;
}) {
  const { to, userName, token } = params;
  const link = `${env.APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}`;

  await mailer.sendMail({
    from: `"ClinicaShare" <${env.EMAIL_SERVICE_USER_EMAIL}>`,
    to,
    subject: "Redefinir sua senha",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Olá, ${userName}!</h1>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no ClinicaShare.</p>
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Redefinir senha</a>
            </p>
            <p style="font-size: 14px; color: #666;">Se você não solicitou a redefinição, ignore este e-mail. O link expira em 30 minutos.</p>
          </div>
        </body>
      </html>
    `,
  });
}

/**
 * Convite de primeiro acesso. Enviado quando admin cadastra um
 * profissional ou membro da equipe — reusa a coluna `passwordResetToken`
 * com TTL maior (7 dias) pra dar tempo do convidado abrir o e-mail.
 */
export async function sendInviteEmail(params: {
  to: string;
  userName: string;
  invitedAs: "profissional" | "auxiliar" | "atendente";
  token: string;
}) {
  const { to, userName, invitedAs, token } = params;
  const link = `${env.APP_URL}/redefinir-senha?token=${encodeURIComponent(token)}&email=${encodeURIComponent(to)}&primeiroAcesso=1`;

  const cargoLabel = {
    profissional: "profissional da clínica",
    auxiliar: "auxiliar financeiro",
    atendente: "atendente",
  }[invitedAs];

  await mailer.sendMail({
    from: `"ClinicaShare" <${env.EMAIL_SERVICE_USER_EMAIL}>`,
    to,
    subject: "Bem-vindo(a) ao ClinicaShare — defina sua senha",
    html: `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Olá, ${userName}!</h1>
            <p>Você foi cadastrado(a) no ClinicaShare como <strong>${cargoLabel}</strong>. Para acessar a plataforma, defina sua senha clicando no botão abaixo.</p>
            <p style="margin: 30px 0;">
              <a href="${link}" style="background-color: #0ea5e9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Definir minha senha</a>
            </p>
            <p style="font-size: 14px; color: #666;">O link expira em 7 dias. Se não foi você, peça para o administrador cancelar este convite.</p>
          </div>
        </body>
      </html>
    `,
  });
}
