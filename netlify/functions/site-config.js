const { getStoreWithFallback } = require('../lib/store')
const { verifyAdmin } = require('../lib/admin')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

function getStoreInstance() {
  return getStoreWithFallback('site-config')
}

const defaultConfig = {
  logo_url: '/logo.png',
  logo_icon_url: '/logo-icon.png',
  hero_image_url: '/images/hero-destaque.jpg',
  hero_title: 'Encontra o teu próximo emprego',
  hero_subtitle: 'Vagas novas todos os dias das melhores empresas em Angola.',
  support_whatsapp: '244934859497',
  ad_price_per_day: 500,
  ad_default_duration_days: 7,
  ad_max_active: 5,
  maintenance_mode: false,
  site_title: 'MÔ SALO',
  site_description: 'Plataforma de recrutamento inteligente angolana.',
  primary_color: '#BC181C',
  secondary_color: '#ECA61B',
}

async function getConfig(store) {
  try {
    const raw = await store.get('config')
    if (!raw) return defaultConfig
    const parsed = JSON.parse(raw)
    return { ...defaultConfig, ...parsed }
  } catch {
    return defaultConfig
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreInstance()

  if (event.httpMethod === 'GET') {
    const config = await getConfig(store)
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, config }) }
  }

  if (event.httpMethod === 'POST') {
    const admin = await verifyAdmin(event)
    if (!admin.isAdmin) {
      return { statusCode: admin.statusCode, headers, body: admin.body }
    }

    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) }
    }

    const current = await getConfig(store)
    const merged = { ...current, ...payload, updated_at: new Date().toISOString() }
    await store.set('config', JSON.stringify(merged))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, config: merged }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
