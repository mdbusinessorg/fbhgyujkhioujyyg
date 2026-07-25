const { getStore } = require('@netlify/blobs')
const { randomUUID } = require('crypto')
const { verifyAdmin } = require('../lib/admin')
const { getConfig } = require('../lib/site-config')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

function getStoreInstance() {
  return getStore('paid-ads', {
    siteID: process.env.NETLIFY_BLOBS_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  })
}

async function getAds(store) {
  try {
    const raw = await store.get('ads')
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function saveAds(store, ads) {
  await store.set('ads', JSON.stringify(ads))
}

function isActive(ad) {
  if (ad.status !== 'approved') return false
  if (ad.status === 'paused') return false
  if (ad.expires_at) {
    return new Date(ad.expires_at) > new Date()
  }
  return true
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreInstance()
  const ads = await getAds(store)
  const params = event.queryStringParameters || {}

  // Track impressions/clicks
  if (event.httpMethod === 'POST' && (params.event === 'impression' || params.event === 'click')) {
    const id = params.id
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obrigatório' }) }
    const index = ads.findIndex((a) => a.id === id)
    if (index === -1) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Anúncio não encontrado' }) }
    if (params.event === 'impression') ads[index].impressions = (ads[index].impressions || 0) + 1
    if (params.event === 'click') ads[index].clicks = (ads[index].clicks || 0) + 1
    ads[index].updated_at = new Date().toISOString()
    await saveAds(store, ads)
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ad: ads[index] }) }
  }

  // Admin: list all ads
  if (event.httpMethod === 'GET' && params.admin === '1') {
    const admin = await verifyAdmin(event)
    if (!admin.isAdmin) {
      return { statusCode: admin.statusCode, headers, body: admin.body }
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ads }) }
  }

  // Public: active ads
  if (event.httpMethod === 'GET') {
    if (params.id) {
      const ad = ads.find((a) => a.id === params.id)
      if (!ad) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Anúncio não encontrado' }) }
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ad }) }
    }
    const active = ads.filter(isActive).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ads: active }) }
  }

  // Create ad (public)
  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) }
    }

    const required = ['title', 'advertiser_name', 'phone', 'image_url']
    const missing = required.filter((k) => !payload[k])
    if (missing.length) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: `Campos em falta: ${missing.join(', ')}` }) }
    }

    const config = await getConfig()
    const duration = Math.max(1, Number(payload.duration_days) || config.ad_default_duration_days || 7)
    const pricePerDay = Number(payload.price_per_day) || config.ad_price_per_day || 500
    const price = Number(payload.price_kz) || duration * pricePerDay

    const now = new Date()
    const ad = {
      id: randomUUID(),
      title: String(payload.title).trim(),
      description: (payload.description || '').trim(),
      advertiser_name: String(payload.advertiser_name).trim(),
      email: (payload.email || '').trim(),
      phone: String(payload.phone).trim(),
      link: (payload.link || '').trim(),
      whatsapp: (payload.whatsapp || '').trim(),
      image_url: String(payload.image_url).trim(),
      duration_days: duration,
      price_per_day: pricePerDay,
      price_kz: price,
      payment_status: 'pending',
      payment_proof_url: payload.payment_proof_url || null,
      status: 'pending',
      starts_at: null,
      expires_at: null,
      impressions: 0,
      clicks: 0,
      admin_notes: '',
      rejected_reason: '',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    }

    ads.unshift(ad)
    await saveAds(store, ads)
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ad }) }
  }

  // Update ad (admin)
  if (event.httpMethod === 'PATCH') {
    const admin = await verifyAdmin(event)
    if (!admin.isAdmin) {
      return { statusCode: admin.statusCode, headers, body: admin.body }
    }

    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'JSON inválido' }) }
    }

    const id = payload.id || params.id
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obrigatório' }) }

    const index = ads.findIndex((a) => a.id === id)
    if (index === -1) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Anúncio não encontrado' }) }

    const current = ads[index]
    const updates = { ...payload, updated_at: new Date().toISOString() }
    delete updates.id

    if (updates.status === 'approved' && current.status !== 'approved') {
      updates.starts_at = new Date().toISOString()
      const days = Number(updates.duration_days) || current.duration_days || 7
      const exp = new Date()
      exp.setDate(exp.getDate() + days)
      updates.expires_at = exp.toISOString()
    }

    if (updates.payment_status === 'paid' && current.payment_status !== 'paid') {
      updates.paid_at = new Date().toISOString()
    }

    ads[index] = { ...current, ...updates }
    await saveAds(store, ads)
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ad: ads[index] }) }
  }

  // Delete ad (admin)
  if (event.httpMethod === 'DELETE') {
    const admin = await verifyAdmin(event)
    if (!admin.isAdmin) {
      return { statusCode: admin.statusCode, headers, body: admin.body }
    }
    const id = params.id
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obrigatório' }) }
    const filtered = ads.filter((a) => a.id !== id)
    await saveAds(store, filtered)
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
