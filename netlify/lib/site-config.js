const { getStoreWithFallback } = require('./store')

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

let cachedConfig = null
let cachedAt = 0

async function getConfig(force = false) {
  const now = Date.now()
  if (!force && cachedConfig && now - cachedAt < 60_000) return cachedConfig
  try {
    const store = getStoreWithFallback('site-config')
    const raw = await store.get('config')
    if (raw) {
      cachedConfig = { ...defaultConfig, ...JSON.parse(raw) }
    } else {
      cachedConfig = defaultConfig
    }
  } catch {
    cachedConfig = defaultConfig
  }
  cachedAt = now
  return cachedConfig
}

module.exports = { getConfig, defaultConfig }
