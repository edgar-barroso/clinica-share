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
