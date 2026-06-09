import nodemailer from "nodemailer";

const from = process.env.EMAIL_FROM || "Clínica Bem Estar <nao-responda@clinicabemestar.pt>";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

/**
 * Envia um email. Em ambiente de desenvolvimento sem SMTP configurado,
 * regista o email na consola em vez de o enviar.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const t = getTransporter();
  if (!t) {
    console.log(
      `\n📧 [EMAIL SIMULADO]\nPara: ${opts.to}\nAssunto: ${opts.subject}\n${opts.html.replace(/<[^>]+>/g, " ").slice(0, 300)}\n`,
    );
    return { simulated: true };
  }
  await t.sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html });
  return { simulated: false };
}

export function emailTemplate(title: string, body: string) {
  return `
  <div style="font-family:Arial,sans-serif;background:#F0F8FF;padding:32px">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(10,116,218,0.12)">
      <div style="background:linear-gradient(135deg,#0A74DA,#00C48C);padding:24px 32px">
        <h1 style="color:#fff;margin:0;font-size:20px">🏥 Clínica Bem Estar</h1>
      </div>
      <div style="padding:32px">
        <h2 style="color:#1A1A2E;margin-top:0">${title}</h2>
        <div style="color:#6B7280;line-height:1.6;font-size:15px">${body}</div>
      </div>
      <div style="padding:16px 32px;background:#F0F8FF;color:#9CA3AF;font-size:12px;text-align:center">
        Esta é uma mensagem automática da Clínica Bem Estar. Por favor não responda.
      </div>
    </div>
  </div>`;
}
