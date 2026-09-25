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

function fmtDate(raw) {
  const ts = Date.parse(raw || '')
  if (Number.isNaN(ts)) return ''
  return new Date(ts).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' })
}

function jobLink(j, siteUrl) {
  return j.id ? `${siteUrl}/vagas/externa/?id=${encodeURIComponent(j.id)}` : `${siteUrl}/vagas/`
}

function chip(text) {
  return `<span style="display:inline-block;background:#EEF2FF;color:#1A56FF;font-size:11px;font-weight:600;padding:3px 10px;border-radius:999px;margin:0 4px 4px 0;">${esc(text)}</span>`
}

function jobCard(j, siteUrl) {
  const title = esc(j.titulo || j.title || 'Vaga')
  const company = esc(j.empresa || j.company || '')
  const loc = esc(j.localizacao || j.location || '')
  const date = fmtDate(j.posted_at || j.first_seen_at)
  const salary = esc(j.salario || j.salary || '')
  const tipo = esc(j.tipo_contrato || '')
  const modalidade = esc(j.modalidade || '')
  const match = Math.round(j._match || 0)
  const chips = [tipo, modalidade, salary].filter(Boolean).map(chip).join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">
  <tr><td style="background:#F6F8FC;border:1px solid #E5EAF2;border-radius:14px;padding:16px 18px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top;">
        <div style="color:#1A56FF;font-size:15px;font-weight:700;line-height:1.3;">${title}</div>
        <div style="color:#5B6472;font-size:13px;margin-top:4px;">${company}${loc ? ` · ${loc}` : ''}</div>
        <div style="margin-top:8px;">${chips}${date ? `<span style="color:#98A1B0;font-size:11px;">${esc(date)}</span>` : ''}</div>
      </td>
      ${match >= 50 ? `<td style="vertical-align:top;text-align:right;" width="56"><div style="background:#1A56FF;color:#fff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:999px;display:inline-block;">${match}% match</div></td>` : ''}
    </tr></table>
    <div style="margin-top:12px;">
      <a href="${jobLink(j, siteUrl)}" style="display:inline-block;background:#1A56FF;color:#fff;font-size:13px;font-weight:700;padding:10px 22px;border-radius:999px;text-decoration:none;">Ver vaga</a>
    </div>
  </td></tr></table>`
}

function buildJobsHtml({ nome, jobs, siteUrl }) {
  const count = jobs.length
  const cards = jobs.map((j) => jobCard(j, siteUrl)).join('')
  const firstName = esc((nome || '').split(' ')[0])

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5F7FA;font-family:'Segoe UI',Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;">${count === 1 ? 'Uma vaga nova' : `${count} vagas novas`} escolhidas para o teu perfil no MÔ SALO.</div>
<div style="max-width:600px;margin:0 auto;">

  <div style="background:linear-gradient(135deg,#1A56FF 0%,#3B6DFF 100%);padding:26px 24px 30px;text-align:center;">
    <div style="color:#fff;font-size:24px;font-weight:800;letter-spacing:0.5px;">MÔ&nbsp;SALO</div>
    <div style="color:#BFD2FF;font-size:12px;margin-top:4px;">Encontre o seu emprego ideal em Angola</div>
  </div>

  <div style="background:#fff;margin:-18px 14px 0;border-radius:18px;box-shadow:0 4px 18px rgba(26,26,46,0.08);overflow:hidden;">
    <div style="padding:26px 24px 6px;text-align:center;">
      <div style="color:#5B6472;font-size:14px;">Olá${firstName ? `, <strong style="color:#1A1A2E;">${firstName}</strong>` : ''}!</div>
      <div style="color:#1A1A2E;font-size:19px;font-weight:800;line-height:1.35;margin-top:8px;">
        ${count === 1 ? 'Encontrámos <span style="color:#1A56FF;">uma vaga</span> para ti' : `Encontrámos <span style="color:#1A56FF;">${count} vagas</span> para ti`}
      </div>
      <div style="color:#5B6472;font-size:13px;margin-top:6px;">Seleccionadas automaticamente segundo o teu perfil e competências.</div>
    </div>

    <div style="padding:16px 20px 20px;">
      ${cards}
      <div style="text-align:center;padding:8px 0 6px;">
        <a href="${siteUrl}/vagas/" style="display:inline-block;background:#1A1A2E;color:#fff;font-size:14px;font-weight:700;padding:14px 34px;border-radius:999px;text-decoration:none;">Ver todas as vagas</a>
      </div>
    </div>
  </div>

  <div style="padding:22px 24px 8px;text-align:center;">
    <div style="color:#1A1A2E;font-size:13px;font-weight:700;margin-bottom:10px;">Não percas nenhuma oportunidade</div>
    <div style="font-size:12px;color:#5B6472;line-height:1.6;">
      Carrega o teu CV e a nossa IA encontra as vagas com mais match para ti.<br>
      <a href="${siteUrl}" style="color:#1A56FF;font-weight:600;text-decoration:none;">Aceder ao MÔ SALO</a>
      &nbsp;·&nbsp;
      <a href="${siteUrl}/pessoas/" style="color:#1A56FF;font-weight:600;text-decoration:none;">Rede</a>
      &nbsp;·&nbsp;
      <a href="${siteUrl}/vagas/" style="color:#1A56FF;font-weight:600;text-decoration:none;">Vagas</a>
    </div>
  </div>

  <div style="padding:14px 24px 30px;text-align:center;color:#98A1B0;font-size:11px;line-height:1.6;">
    Recebeste este email porque tens uma conta no MÔ SALO e há vagas novas compatíveis com o teu perfil.<br>
    © MÔ SALO — Plataforma de emprego de Angola
  </div>
</div>
</body></html>`
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
