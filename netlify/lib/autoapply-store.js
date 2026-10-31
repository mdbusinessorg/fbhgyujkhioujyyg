// Storage do módulo privado de candidatura automática.
// Usa Netlify Blobs (com fallback local em dev) em vez de tabelas Supabase —
// assim o módulo funciona sem DDL no projecto Supabase.
const { getStoreWithFallback } = require('./store')

const STORE_NAME = 'auto-apply'

const DEFAULT_SETTINGS = {
  ativo: true,
  score_minimo: 55,
  limite_diario: 15,
  email_remetente: '',
}

function store() {
  return getStoreWithFallback(STORE_NAME)
}

async function getJson(key, fallback = null) {
  try {
    const raw = await store().get(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

async function getSettings() {
  const s = await getJson('settings')
  return { ...DEFAULT_SETTINGS, ...(s || {}) }
}

async function saveSettings(settings) {
  const clean = {
    ativo: settings.ativo !== false,
    score_minimo: Number(settings.score_minimo ?? DEFAULT_SETTINGS.score_minimo),
    limite_diario: Math.max(1, Number(settings.limite_diario ?? DEFAULT_SETTINGS.limite_diario)),
    email_remetente: String(settings.email_remetente || ''),
    updated_at: new Date().toISOString(),
  }
  await store().set('settings', JSON.stringify(clean))
  return clean
}

const DEFAULT_PROFILE = {
  full_name: 'Matias Domingos',
  bio_longa: '',
  formacao: '',
  certificacoes: [],
  skills: [],
  referencias: [],
  contactos: '',
}

async function getProfile() {
  const p = await getJson('profile')
  return p ? { ...DEFAULT_PROFILE, ...p } : null
}

async function saveProfile(profile) {
  const clean = {
    full_name: String(profile.full_name || DEFAULT_PROFILE.full_name).slice(0, 200),
    bio_longa: String(profile.bio_longa || '').slice(0, 8000),
    formacao: String(profile.formacao || '').slice(0, 2000),
    certificacoes: Array.isArray(profile.certificacoes) ? profile.certificacoes.slice(0, 50) : [],
    skills: Array.isArray(profile.skills) ? profile.skills.slice(0, 80) : [],
    referencias: Array.isArray(profile.referencias) ? profile.referencias.slice(0, 30) : [],
    contactos: String(profile.contactos || '').slice(0, 500),
    updated_at: new Date().toISOString(),
  }
  await store().set('profile', JSON.stringify(clean))
  return clean
}

function newId() {
  return 'cv-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10)
}

async function getCVs() {
  const list = await getJson('cvs')
  return Array.isArray(list) ? list : []
}

async function upsertCV(cv) {
  const list = await getCVs()
  const now = new Date().toISOString()
  const clean = {
    id: cv.id || newId(),
    titulo: String(cv.titulo || 'CV').slice(0, 200),
    cargo_alvo: String(cv.cargo_alvo || '').slice(0, 200),
    arquivo_url: String(cv.arquivo_url || ''),
    skills_cobertas: Array.isArray(cv.skills_cobertas) ? cv.skills_cobertas.slice(0, 80) : [],
    ativo: cv.ativo !== false,
    created_at: cv.created_at || now,
    updated_at: now,
  }
  const idx = list.findIndex(c => c.id === clean.id)
  if (idx >= 0) list[idx] = clean
  else list.unshift(clean)
  await store().set('cvs', JSON.stringify(list))
  return clean
}

async function deleteCV(id) {
  const list = await getCVs()
  const next = list.filter(c => c.id !== id)
  await store().set('cvs', JSON.stringify(next))
  return next.length !== list.length
}

function logKey(jobId) {
  return `logs/${String(jobId).replace(/[^a-zA-Z0-9_.-]/g, '_')}`
}

async function findLog(jobId) {
  return getJson(logKey(jobId))
}

async function saveLog(jobId, log) {
  const clean = {
    ...log,
    external_job_id: jobId,
    updated_at: new Date().toISOString(),
    created_at: log.created_at || new Date().toISOString(),
  }
  await store().set(logKey(jobId), JSON.stringify(clean))
  return clean
}

// Lista todos os logs (mais recentes primeiro). `limit` corta o resultado.
async function listLogs(limit = 500) {
  const raw = await store().list({ prefix: 'logs/' })
  const entries = Array.isArray(raw) ? raw : (raw?.blobs || [])
  const names = entries.map(k => (typeof k === 'string' ? k : k.key)).filter(Boolean)
  const logs = []
  for (const name of names) {
    const l = await getJson(name)
    if (l) logs.push(l)
    if (logs.length >= limit) break
  }
  logs.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
  return logs
}

async function countSentToday() {
  const today = new Date().toISOString().slice(0, 10)
  const logs = await listLogs(2000)
  return logs.filter(l => l.status === 'enviado' && String(l.created_at || '').startsWith(today)).length
}

module.exports = {
  DEFAULT_SETTINGS,
  DEFAULT_PROFILE,
  getSettings,
  saveSettings,
  getProfile,
  saveProfile,
  getCVs,
  upsertCV,
  deleteCV,
  findLog,
  saveLog,
  listLogs,
  countSentToday,
}
