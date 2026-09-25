const { getStoreWithFallback } = require('../lib/store')
const { emailConfigured, sendEmail, buildJobsHtml, MAX_EMAILS_PER_RUN } = require('../lib/email')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d0CD9GsxB4rDVh-SmQUikA_owJjXbAQ'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || process.env.DEPLOY_URL || 'https://mosalo.eu.cc'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

async function supabaseRest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`)
  return res.json()
}

function normalize(text) {
  return (text || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function tokens(text) {
  return normalize(text).split(/[\s,;|]+/).map(t => t.trim()).filter(t => t.length > 2)
}

function isRecent(job, hours = 24) {
  const raw = job.first_seen_at || job.posted_at || job.created_at
  const ts = Date.parse(raw)
  if (!raw || Number.isNaN(ts)) return false
  return Date.now() - ts < hours * 60 * 60 * 1000
}

function computeMatchScore(job, profile) {
  if (!profile) return 0
  const text = normalize(`${job.titulo || job.title || ''} ${job.area || job.category || ''} ${job.descricao || job.description || job.excerpt || ''}`)
  const local = normalize(`${job.localizacao || job.location || ''}`)
  let score = 0

  if (profile.area) {
    const areaTokens = tokens(profile.area)
    for (const a of areaTokens) {
      if (text.includes(a)) score += 25
    }
  }

  if (profile.localizacao && local.includes(normalize(profile.localizacao))) {
    score += 20
  }

  const competencias = Array.isArray(profile.competencias)
    ? profile.competencias
    : tokens(profile.competencias)
  for (const c of competencias) {
    const term = typeof c === 'string' ? c.trim() : ''
    if (term.length > 2 && text.includes(term.toLowerCase())) score += 10
  }

  if (profile.nivel_academico && text.includes(normalize(profile.nivel_academico))) score += 5
  if (profile.experiencias && text.includes(normalize(profile.experiencias))) score += 8
  if (profile.bio && text.includes(normalize(profile.bio))) score += 5

  if (job.salario || job.salary) score += 5
  if (job.is_prioritaria) score += 15

  return Math.min(score, 100)
}

async function getNotificationsStore() {
  return getStoreWithFallback('notifications')
}

async function getStateStore() {
  return getStoreWithFallback('job-notifications')
}

async function loadNotifications(store) {
  const raw = (await store.get('all')) || '[]'
  try { return JSON.parse(raw) } catch { return [] }
}

async function saveNotifications(store, items) {
  await store.set('all', JSON.stringify(items))
}

async function fetchExternalJobs() {
  const res = await fetch(`${SITE_URL}/external-jobs.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Erro ao buscar external-jobs.json: ${res.status}`)
  const data = await res.json()
  const jobs = Array.isArray(data) ? data : (Array.isArray(data.jobs) ? data.jobs : [])
  return jobs.map((j) => ({ ...j, id: j.id || j.favId || crypto.randomUUID() }))
}

async function fetchProfiles() {
  const profiles = await supabaseRest('/profiles?select=user_id,area,localizacao,competencias,nivel_academico,experiencias,bio&limit=1000')
  return profiles.filter(p => p.user_id)
}

async function fetchUserEmails() {
  const users = await supabaseRest('/users?select=id,email,nome&limit=2000')
  const map = new Map()
  for (const u of users || []) {
    if (u.id && u.email) map.set(u.id, { email: u.email, nome: u.nome || '' })
  }
  return map
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  try {
    const [jobs, profiles, userEmails] = await Promise.all([fetchExternalJobs(), fetchProfiles(), fetchUserEmails()])
    const stateStore = await getStateStore()
    const notifStore = await getNotificationsStore()

    const seenRaw = (await stateStore.get('seen-ids')) || '[]'
    let seenIds = []
    try { seenIds = JSON.parse(seenRaw) } catch {}
    const seenSet = new Set(seenIds)

    const force = event.queryStringParameters?.force === 'true' || event.queryStringParameters?.force === '1'
    let newJobs = []

    if (force) {
      newJobs = jobs.filter((j) => isRecent(j, 24))
    } else if (seenSet.size === 0) {
      newJobs = jobs
    } else {
      newJobs = jobs.filter((j) => !seenSet.has(j.id))
    }
    if (newJobs.length === 0) {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, new: 0, notifications: 0 }) }
    }

    const allIds = jobs.map((j) => j.id)
    await stateStore.set('seen-ids', JSON.stringify(allIds))

    const notifications = await loadNotifications(notifStore)
    let created = 0
    const emailsToSend = []

    for (const profile of profiles) {
      const scored = newJobs
        .map((job) => ({ job, score: computeMatchScore(job, profile) }))
        .filter((s) => s.score >= 25)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)

      if (scored.length === 0) continue

      const titles = scored.map((s) => s.job.titulo || s.job.title).filter(Boolean).join(', ')
      const title = scored.length === 1 ? 'Nova vaga para ti' : `${scored.length} novas vagas para ti`
      const body = scored.length === 1
        ? `Encontrámos uma vaga que combina contigo: ${titles}.`
        : `Encontrámos vagas que combinam contigo: ${titles}.`

      notifications.push({
        id: crypto.randomUUID(),
        user_id: profile.user_id,
        type: 'job_match',
        title,
        body,
        data: {
          job_ids: scored.map((s) => s.job.id),
          job_titles: scored.map((s) => s.job.titulo || s.job.title),
          scores: scored.map((s) => s.score),
        },
        sender: { id: 'mosalo-bot', nome: 'MÔ SALO', role: 'admin' },
        read: false,
        created_at: new Date().toISOString(),
      })
      created++

      const contact = userEmails.get(profile.user_id)
      if (contact?.email) {
        emailsToSend.push({ contact, scored })
      }
    }

    await saveNotifications(notifStore, notifications)

    let emailed = 0
    if (emailConfigured()) {
      for (const { contact, scored } of emailsToSend.slice(0, MAX_EMAILS_PER_RUN)) {
        try {
          const jobList = scored.map((s) => s.job)
          const subject = scored.length === 1
            ? `Nova vaga para ti: ${scored[0].job.titulo || scored[0].job.title}`
            : `${scored.length} novas vagas no MÔ SALO`
          await sendEmail({
            to: contact,
            subject: subject.slice(0, 120),
            html: buildJobsHtml({ nome: contact.nome, jobs: jobList, siteUrl: SITE_URL }),
          })
          emailed++
          await new Promise((r) => setTimeout(r, 120))
        } catch (e) {
          console.error(`email para ${contact.email} falhou:`, e.message || e)
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, new: newJobs.length, notifications: created, emailed }),
    }
  } catch (err) {
    console.error('Erro notify-new-jobs:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err) }) }
  }
}
