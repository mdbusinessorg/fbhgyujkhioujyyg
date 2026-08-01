// Shared logic for the private auto-apply module (Matias only).
const { groqChat } = require('./_groq')
const nodemailer = require('nodemailer')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

async function supabaseRest(path, { method = 'GET', body, headers: extra = {} } = {}) {
  const url = `${SUPABASE_URL}/rest/v1${path}`
  const opts = {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : undefined,
      ...extra,
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  const txt = await res.text()
  if (!res.ok) {
    throw new Error(`Supabase ${res.status} ${url}: ${txt.slice(0, 400)}`)
  }
  if (!txt) return null
  try { return JSON.parse(txt) } catch { return txt }
}

function extractEmail(text) {
  const cleaned = String(text || '').replace(/\[at\]|\(at\)|\[arroba\]|\(arroba\)/gi, '@').replace(/\s*@\s*/g, '@')
  const re = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
  const matches = cleaned.match(re) || []
  const unique = [...new Set(matches.map(m => m.toLowerCase()))]
  // Filter out common false positives and example emails.
  const blocked = /example|teste|nao|não|noemail|nome\.email|seuemail|seudominio|empresa\.com|@example\.|@test\.|\d{4}@|\d{5}@/
  const valid = unique.filter(e => !blocked.test(e) && e.includes('.') && e.split('@')[1].split('.').length >= 2)
  return valid[0] || null
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

async function getSettings() {
  const rows = await supabaseRest('/auto_apply_settings?limit=1')
  return rows?.[0] || {
    id: '00000000-0000-0000-0000-000000000001',
    ativo: true,
    score_minimo: 55,
    limite_diario: 15,
    email_remetente: 'suporte@mosalo.eu.cc',
  }
}

async function getAdminUserId() {
  const rows = await supabaseRest(`/users?select=id&email=eq.${encodeURIComponent('matiasdomingos158@gmail.com')}&limit=1`)
  return rows?.[0]?.id
}

async function getProfile(userId) {
  const rows = await supabaseRest(`/candidate_profile?user_id=eq.${userId}&limit=1`)
  return rows?.[0]
}

async function getActiveCVs(userId) {
  return supabaseRest(`/candidate_cvs?user_id=eq.${userId}&ativo=eq.true&order=created_at.desc`)
}

async function getCVFileBuffer(arquivoUrl) {
  // arquivo_url can be a public Supabase Storage URL or a path.
  let url = arquivoUrl
  if (!/^https?:\/\//i.test(url)) {
    url = `${SUPABASE_URL}/storage/v1/object/public/documentos/${arquivoUrl.replace(/^\//, '')}`
  }
  const res = await fetch(url, { headers: { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` } })
  if (!res.ok) throw new Error(`CV download ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function countSentToday() {
  const today = todayDate()
  const rows = await supabaseRest(`/job_applications_log?status=eq.enviado&created_at=gte.${encodeURIComponent(today)}T00:00:00Z&created_at=lt.${encodeURIComponent(today)}T23:59:59.999Z&select=count`)
  // Supabase returns count in a header; fallback to array length.
  return Array.isArray(rows) ? rows.length : 0
}

async function findLog(jobId) {
  const rows = await supabaseRest(`/job_applications_log?external_job_id=eq.${encodeURIComponent(jobId)}&limit=1`)
  return rows?.[0] || null
}

async function insertLog(payload) {
  return supabaseRest('/job_applications_log', { method: 'POST', body: payload })
}

async function updateLog(id, payload) {
  return supabaseRest(`/job_applications_log?id=eq.${id}`, { method: 'PATCH', body: payload })
}

async function buildPrompt(job, profile, cvs) {
  const desc = String(job.description || job.excerpt || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').slice(0, 2500)
  const certificacoes = Array.isArray(profile.certificacoes) ? profile.certificacoes.join(', ') : profile.certificacoes
  const skills = Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills
  const cvsText = (cvs || []).map(c => `- ${c.titulo} (cargo-alvo: ${c.cargo_alvo}; skills: ${Array.isArray(c.skills_cobertas) ? c.skills_cobertas.join(', ') : c.skills_cobertas || ''})`).join('\n')

  const system = `És o assistente privado de candidatura automática do Matias para vagas de emprego em Angola.
Tarefa: analisar a vaga, comparar com o perfil e CVs do Matias, e devolver um objeto JSON com a melhor candidatura possível.
Regras absolutas:
- NUNCA inventes experiência, formação, certificação ou skill que não esteja no perfil/CV fornecidos.
- Cita APENAS 3-5 skills/certificações que batem genuinamente com a vaga.
- Menciona o INP e a experiência na SLB (ESSO/NGC) apenas quando forem genuinamente relevantes para a vaga.
- O corpo do email deve ser em português profissional de Angola, curto (150-250 palavras), objetivo e sem fluff.
- Se o texto da vaga for claramente em inglês, gera o email em INGLÊS.
- Inclui uma despedida cordial com o nome completo e contactos se existirem no perfil.
- O assunto deve ser curto e profissional.
- O CV recomendado deve ser um dos IDs da lista de CVs fornecida.
Responde APENAS com JSON válido neste formato:
{
  "score_match": 0-100,
  "cv_recomendado_id": "uuid",
  "skills_destacadas": ["..."],
  "assunto_email": "...",
  "corpo_email": "..."
}`

  const user = `VAGA:
Título: ${job.title || ''}
Empresa: ${job.company || ''}
Localização: ${job.location || ''}
Categoria: ${job.category || ''}
Tipo de contrato: ${job.tipo_contrato || ''}
Modalidade: ${job.modalidade || ''}
Requisitos: ${job.requisitos || ''}
Benefícios: ${job.beneficios || ''}
Descrição: ${desc}

PERFIL DO MATIAS:
Nome: ${profile.full_name || 'Matias Domingos'}
Bio/percurso: ${profile.bio_longa || ''}
Formação: ${profile.formacao || ''}
Certificações: ${certificacoes || ''}
Skills: ${skills || ''}

CVS DISPONÍVEIS:
${cvsText || 'Nenhum CV registado.'}`

  return { system, user }
}

async function generateApplication(job, profile, cvs) {
  const { system, user } = buildPrompt(job, profile, cvs)
  const raw = await groqChat(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    { temperature: 0.45, maxTokens: 900, json: true }
  )
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error('Resposta da IA não é JSON válido')
  }
  if (typeof parsed.score_match !== 'number' || !parsed.assunto_email || !parsed.corpo_email) {
    throw new Error('Resposta da IA incompleta')
  }
  return {
    score_match: Math.min(100, Math.max(0, Number(parsed.score_match))),
    cv_recomendado_id: parsed.cv_recomendado_id || null,
    skills_destacadas: Array.isArray(parsed.skills_destacadas) ? parsed.skills_destacadas : [],
    assunto_email: String(parsed.assunto_email).trim(),
    corpo_email: String(parsed.corpo_email).trim(),
  }
}

async function sendApplicationEmail({ to, subject, body, cvUrl, fromEmail, smtpConfig }) {
  const cfg = smtpConfig || {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || fromEmail,
      pass: process.env.SMTP_PASS || '',
    },
  }
  const transporter = nodemailer.createTransport(cfg)
  const attachments = []
  if (cvUrl) {
    const buf = await getCVFileBuffer(cvUrl)
    attachments.push({
      filename: cvUrl.split('/').pop() || 'cv.pdf',
      content: buf,
    })
  }
  const info = await transporter.sendMail({
    from: fromEmail,
    to,
    subject,
    text: body,
    attachments,
  })
  return info
}

async function processExternalJob(job, { force = false, dryRun = false } = {}) {
  const settings = await getSettings()
  if (!settings.ativo && !force) {
    return { skipped: true, reason: 'módulo desativado' }
  }

  const userId = await getAdminUserId()
  if (!userId) {
    throw new Error('Admin user matiasdomingos158@gmail.com not found')
  }

  // Duplicate check
  const existing = await findLog(job.id)
  if (existing) {
    if (!dryRun) await updateLog(existing.id, { status: 'duplicado' })
    return { skipped: true, status: 'duplicado', logId: existing.id }
  }

  // Daily limit
  const sentToday = await countSentToday()
  if (sentToday >= settings.limite_diario && !force) {
    return { skipped: true, reason: 'limite diário atingido', sentToday, limit: settings.limite_diario }
  }

  // Extract email
  const emailDestino = extractEmail(`${job.description || ''} ${job.apply_url || ''} ${job.excerpt || ''}`)
  if (!emailDestino) {
    const payload = {
      external_job_id: job.id,
      status: 'sem_email',
      score_match: 0,
      email_destino: null,
    }
    const inserted = dryRun ? null : await insertLog(payload)
    return { skipped: true, status: 'sem_email', logId: inserted?.[0]?.id || null }
  }

  // Load profile and CVs
  const profile = await getProfile(userId)
  const cvs = await getActiveCVs(userId)
  if (!profile || cvs.length === 0) {
    throw new Error('Perfil ou CVs do candidato não configurados')
  }

  // AI generation
  const ai = await generateApplication(job, profile, cvs)

  // Threshold
  if (ai.score_match < settings.score_minimo && !force) {
    const payload = {
      external_job_id: job.id,
      status: 'sem_match',
      score_match: ai.score_match,
      cv_usado_id: ai.cv_recomendado_id,
      email_destino: emailDestino,
      skills_destacadas: ai.skills_destacadas,
    }
    const inserted = dryRun ? null : await insertLog(payload)
    return { skipped: true, status: 'sem_match', score: ai.score_match, logId: inserted?.[0]?.id || null }
  }

  // Pick CV: use AI recommendation if valid, otherwise first active.
  let cvUsado = cvs.find(c => c.id === ai.cv_recomendado_id)
  if (!cvUsado) cvUsado = cvs[0]

  // Send email with retries
  let lastError = null
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (!dryRun) {
        await sendApplicationEmail({
          to: emailDestino,
          subject: ai.assunto_email,
          body: ai.corpo_email,
          cvUrl: cvUsado.arquivo_url,
          fromEmail: settings.email_remetente,
        })
      }
      const payload = {
        external_job_id: job.id,
        status: 'enviado',
        cv_usado_id: cvUsado.id,
        email_destino: emailDestino,
        assunto_email: ai.assunto_email,
        corpo_email: ai.corpo_email,
        score_match: ai.score_match,
        skills_destacadas: ai.skills_destacadas,
      }
      const inserted = dryRun ? null : await insertLog(payload)
      return { sent: true, status: 'enviado', to: emailDestino, score: ai.score_match, logId: inserted?.[0]?.id || null, attempts: attempt }
    } catch (err) {
      lastError = err
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 1500))
    }
  }

  // All retries failed
  const payload = {
    external_job_id: job.id,
    status: 'erro',
    cv_usado_id: cvUsado.id,
    email_destino: emailDestino,
    score_match: ai.score_match,
    skills_destacadas: ai.skills_destacadas,
    erro_detalhe: String(lastError?.message || lastError).slice(0, 1000),
  }
  const inserted = dryRun ? null : await insertLog(payload)
  throw new Error(`Falha ao enviar após 3 tentativas: ${lastError?.message || lastError}`)
}

module.exports = {
  headers,
  supabaseRest,
  extractEmail,
  todayDate,
  getSettings,
  getAdminUserId,
  getProfile,
  getActiveCVs,
  getCVFileBuffer,
  countSentToday,
  findLog,
  insertLog,
  updateLog,
  generateApplication,
  sendApplicationEmail,
  processExternalJob,
}
