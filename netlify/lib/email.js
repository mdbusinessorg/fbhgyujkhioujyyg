// Envio de emails transaccionais via API HTTP.
// Suporta Brevo (recomendado, 300/dia grátis, sem verificação de domínio) e Resend.
// Env vars: EMAIL_PROVIDER ('brevo'|'resend'), EMAIL_API_KEY, EMAIL_FROM, EMAIL_FROM_NAME

const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || 'brevo').toLowerCase()
const EMAIL_API_KEY = process.env.EMAIL_API_KEY || process.env.BREVO_API_KEY || process.env.RESEND_API_KEY || ''
const EMAIL_FROM = process.env.EMAIL_FROM || ''
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'MÔ SALO'
const MAX_EMAILS_PER_RUN = parseInt(process.env.MAX_EMAILS_PER_RUN || '250', 10)

function emailConfigured() {
  return Boolean(EMAIL_API_KEY && EMAIL_FROM)
}

function esc(s) {
  return (s || '').toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function buildJobsHtml({ nome, jobs, siteUrl }) {
  const items = jobs.map((j) => {
    const title = esc(j.titulo || j.title || 'Vaga')
    const company = esc(j.empresa || j.company || '')
    const loc = esc(j.localizacao || j.location || '')
    const link = `${siteUrl}/vagas/?q=${encodeURIComponent(title)}`
    return `<tr><td style="padding:12px 16px;border-bottom:1px solid #E5EAF2;">
      <a href="${link}" style="color:#1A56FF;font-weight:600;text-decoration:none;font-size:15px;">${title}</a>
      <div style="color:#5B6472;font-size:13px;margin-top:4px;">${company}${loc ? ` · ${loc}` : ''}</div>
    </td></tr>`
  }).join('')

  return `<!doctype html><html><body style="margin:0;padding:0;background:#F5F7FA;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:24px 12px;">
    <div style="background:#1A56FF;border-radius:16px 16px 0 0;padding:20px 24px;">
      <span style="color:#fff;font-size:20px;font-weight:700;">MÔ SALO</span>
      <div style="color:#DCE6FF;font-size:13px;margin-top:4px;">Novas vagas que combinam contigo</div>
    </div>
    <div style="background:#fff;border:1px solid #E5EAF2;border-top:none;border-radius:0 0 16px 16px;overflow:hidden;">
      <div style="padding:16px 16px 4px;color:#1A1A2E;font-size:14px;">Olá${nome ? `, <strong>${esc(nome)}</strong>` : ''}! Encontrámos ${jobs.length === 1 ? 'uma vaga' : `${jobs.length} vagas`} para o teu perfil:</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${items}</table>
      <div style="padding:16px;text-align:center;">
        <a href="${siteUrl}/vagas/" style="display:inline-block;background:#1A56FF;color:#fff;padding:12px 28px;border-radius:999px;font-weight:700;font-size:14px;text-decoration:none;">Ver todas as vagas</a>
      </div>
      <div style="padding:0 16px 16px;color:#98A1B0;font-size:11px;text-align:center;">
        Recebeste este email porque tens uma conta no MÔ SALO. <a href="${siteUrl}/definicoes/" style="color:#98A1B0;">Gerir notificações</a>
      </div>
    </div>
  </div></body></html>`
}

async function sendBrevo({ to, subject, html }) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': EMAIL_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: EMAIL_FROM_NAME, email: EMAIL_FROM },
      to: [{ email: to.email, name: to.nome || undefined }],
      subject,
      htmlContent: html,
    }),
  })
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

async function sendResend({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${EMAIL_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: [to.email],
      subject,
      html,
    }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`)
}

async function sendEmail({ to, subject, html }) {
  if (EMAIL_PROVIDER === 'resend') return sendResend({ to, subject, html })
  return sendBrevo({ to, subject, html })
}

module.exports = { emailConfigured, sendEmail, buildJobsHtml, MAX_EMAILS_PER_RUN }
