// Endpoint admin do módulo privado de candidatura automática.
// CRUD de perfil/CVs/config + histórico, tudo em Netlify Blobs.
const { verifyAdmin } = require('../lib/admin')
const store = require('../lib/autoapply-store')

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

async function fullState() {
  const [profile, cvs, settings, logs] = await Promise.all([
    store.getProfile(),
    store.getCVs(),
    store.getSettings(),
    store.listLogs(200),
  ])
  return { profile, cvs, settings, logs }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const admin = await verifyAdmin(event)
  if (!admin.isAdmin) {
    return { statusCode: admin.statusCode || 403, headers, body: admin.body || JSON.stringify({ error: 'Forbidden' }) }
  }

  if (event.httpMethod === 'GET') {
    return { statusCode: 200, headers, body: JSON.stringify(await fullState()) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body
  try { body = JSON.parse(event.body || '{}') } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  const action = String(body.action || '')
  try {
    if (action === 'saveProfile') {
      return { statusCode: 200, headers, body: JSON.stringify({ profile: await store.saveProfile(body.profile || {}) }) }
    }
    if (action === 'saveSettings') {
      return { statusCode: 200, headers, body: JSON.stringify({ settings: await store.saveSettings(body.settings || {}) }) }
    }
    if (action === 'upsertCV') {
      return { statusCode: 200, headers, body: JSON.stringify({ cv: await store.upsertCV(body.cv || {}) }) }
    }
    if (action === 'deleteCV') {
      return { statusCode: 200, headers, body: JSON.stringify({ deleted: await store.deleteCV(body.id) }) }
    }
    if (action === 'seedDefaults') {
      const p = (await store.getProfile()) || (await store.saveProfile({}))
      const s = await store.getSettings()
      return { statusCode: 200, headers, body: JSON.stringify({ profile: p, settings: s }) }
    }
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Acção desconhecida' }) }
  } catch (err) {
    console.error('auto-apply-admin error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err.message || err) }) }
  }
}
