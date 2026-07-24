const { getStore } = require('@netlify/blobs')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

async function getStoreInstance() {
  return getStore('ad-analytics', {
    siteID: process.env.NETLIFY_BLOBS_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  })
}

async function getStats(store) {
  const raw = (await store.get('stats')) || '{}'
  try { return JSON.parse(raw) } catch { return {} }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = await getStoreInstance()
  const stats = await getStats(store)
  const ad = event.queryStringParameters?.ad || 'curso-preparatorio'

  if (event.httpMethod === 'POST') {
    const type = event.queryStringParameters?.event || 'impression'
    if (!stats[ad]) {
      stats[ad] = { impressions: 0, clicks: 0, updated_at: new Date().toISOString() }
    }
    if (type === 'click') stats[ad].clicks += 1
    else stats[ad].impressions += 1
    stats[ad].updated_at = new Date().toISOString()
    await store.set('stats', JSON.stringify(stats))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ad, stats: stats[ad] }) }
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ad, stats: stats[ad] || { impressions: 0, clicks: 0 } }) }
}
