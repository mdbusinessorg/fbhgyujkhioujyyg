// Triggers diários automáticos:
// 1. Digest de vagas do dia publicado na aba Pessoas (autor: MÔ SALO)
// 2. Aviso ao recrutador quando a vaga interna tem 25+ dias
// 3. Limpeza: stories expirados e notificações com mais de 30 dias
const { getStoreWithFallback } = require('../lib/store')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d0CD9GsxB4rDVh-SmQUikA_owJjXbAQ'
const SITE_URL = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://mosalo.eu.cc'

const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }

const BOT = { id: 'mosalo-bot', nome: 'MÔ SALO', role: 'admin', avatar_url: '/logo-icon.png' }

async function supabaseRest(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  return res.json()
}

function isSameDay(raw, ref) {
  const ts = Date.parse(raw)
  if (!raw || Number.isNaN(ts)) return false
  const d = new Date(ts)
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate()
}

async function readJson(store, key, fallback) {
  try { return JSON.parse((await store.get(key)) || '') } catch { return fallback }
}

async function dailyDigestPost(stateStore) {
  const today = new Date()
  const dayKey = today.toISOString().slice(0, 10)
  const state = await readJson(stateStore, 'daily-digest', {})
  if (state.lastDay === dayKey) return { skipped: 'já publicado hoje' }

  const res = await fetch(`${SITE_URL}/external-jobs.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`external-jobs.json ${res.status}`)
  const data = await res.json()
  const jobs = (Array.isArray(data) ? data : data.jobs || []).filter(j => isSameDay(j.first_seen_at || j.posted_at, today))
  if (jobs.length === 0) return { skipped: 'sem vagas hoje' }

  const top = jobs.slice(0, 5).map(j => `• ${j.title}${j.company ? ` — ${j.company}` : ''}`).join('\n')
  const content = `📢 ${jobs.length} ${jobs.length === 1 ? 'vaga nova' : 'vagas novas'} hoje no MÔ SALO!\n\n${top}${jobs.length > 5 ? `\n\n...e mais ${jobs.length - 5}. Vê todas em ${SITE_URL}/vagas/` : `\n\nCandidata-te em ${SITE_URL}/vagas/`}`

  const postsStore = getStoreWithFallback('posts')
  const posts = await readJson(postsStore, 'all', [])
  posts.unshift({
    id: crypto.randomUUID(),
    user_id: BOT.id,
    content,
    media_url: null,
    author: BOT,
    type: 'post',
    vaga_id: null,
    is_featured_job: false,
    area: '',
    is_verified: true,
    created_at: new Date().toISOString(),
  })
  await postsStore.set('all', JSON.stringify(posts))
  await stateStore.set('daily-digest', JSON.stringify({ lastDay: dayKey }))
  return { posted: jobs.length }
}

async function notifyExpiringVagas(stateStore) {
  const state = await readJson(stateStore, 'expiring-notified', [])
  const notified = new Set(state)
  const cutoff = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
  const vagas = await supabaseRest(`/vagas?select=id,titulo,recrutador_id,created_at&status=eq.aberta&created_at=lt.${encodeURIComponent(cutoff)}&limit=100`)

  const notifStore = getStoreWithFallback('notifications')
  const notifications = await readJson(notifStore, 'all', [])
  let created = 0
  for (const v of vagas) {
    if (!v.recrutador_id || notified.has(v.id)) continue
    const days = Math.floor((Date.now() - Date.parse(v.created_at)) / 86400000)
    notifications.push({
      id: crypto.randomUUID(),
      user_id: v.recrutador_id,
      type: 'vaga_expiring',
      title: 'Vaga prestes a expirar',
      body: `A tua vaga "${v.titulo}" está aberta há ${days} dias. Renova-a ou fecha-a no teu painel.`,
      data: { vaga_id: v.id },
      sender: BOT,
      read: false,
      created_at: new Date().toISOString(),
    })
    notified.add(v.id)
    created++
  }
  if (created > 0) {
    await notifStore.set('all', JSON.stringify(notifications))
    await stateStore.set('expiring-notified', JSON.stringify(Array.from(notified)))
  }
  return { expiring: created }
}

async function cleanup() {
  const now = new Date().toISOString()
  const statusesStore = getStoreWithFallback('statuses')
  const statuses = await readJson(statusesStore, 'all', [])
  const activeStatuses = statuses.filter(s => s.expires_at && s.expires_at > now)
  if (activeStatuses.length !== statuses.length) await statusesStore.set('all', JSON.stringify(activeStatuses))

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const notifStore = getStoreWithFallback('notifications')
  const notifications = await readJson(notifStore, 'all', [])
  const keep = notifications.filter(n => (n.created_at || now) > cutoff)
  if (keep.length !== notifications.length) await notifStore.set('all', JSON.stringify(keep))

  return { statusesRemoved: statuses.length - activeStatuses.length, notificationsRemoved: notifications.length - keep.length }
}

exports.handler = async () => {
  const stateStore = getStoreWithFallback('daily-triggers')
  const results = {}
  for (const [name, fn] of [
    ['digest', () => dailyDigestPost(stateStore)],
    ['expiring', () => notifyExpiringVagas(stateStore)],
    ['cleanup', cleanup],
  ]) {
    try { results[name] = await fn() } catch (err) { results[name] = { error: String(err) } }
  }
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ...results }) }
}
