// Aprovação automática de pedidos pendentes do MÔ SALO.
// Cobre: recrutadores por aprovar, vagas em análise, pedidos de pagamento e anúncios pagos.
// Corre por schedule (Netlify Clockwork) e pode ser disparado manualmente por um admin.
const { getAdminClient } = require('../lib/supabase-admin')
const { getStoreWithFallback } = require('../lib/store')
const { verifyAdmin } = require('../lib/admin')
const { isScheduledOrInternal } = require('../lib/security')

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

async function approveRecruiters(supabase) {
  const { data, error } = await supabase
    .from('users')
    .update({ aprovado: true })
    .eq('role', 'recrutador')
    .or('aprovado.is.null,aprovado.eq.false')
    .select('id')
  if (error) throw new Error(`recrutadores: ${error.message}`)
  return (data || []).length
}

async function approveVagas(supabase) {
  const { data, error } = await supabase
    .from('vagas')
    .update({ status: 'aberta' })
    .eq('status', 'em_analise')
    .select('id')
  if (error) throw new Error(`vagas: ${error.message}`)
  return (data || []).length
}

async function approvePayments(supabase) {
  const { data: pending, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('status', 'pending')
  if (error) throw new Error(`pagamentos: ${error.message}`)

  let approved = 0
  for (const req of pending || []) {
    const planName = String(req.plan || req.plano || '').toLowerCase()
    const isQuickJob = planName === 'trabalho_rapido' || planName.includes('trabalho') || planName.includes('rapido')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (isQuickJob ? 30 : 3))
    const expiresIso = expiresAt.toISOString()

    // O filtro .eq('status', 'pending') evita aprovar duas vezes em corridas simultâneas.
    const { data: updated, error: updateError } = await supabase
      .from('payment_requests')
      .update({
        status: 'approved',
        reviewed_at: new Date().toISOString(),
        premium_expires_at: expiresIso,
      })
      .eq('id', req.id)
      .eq('status', 'pending')
      .select('id')
    if (updateError) throw new Error(`pagamento ${req.id}: ${updateError.message}`)
    if (!updated || updated.length === 0) continue

    if (isQuickJob) {
      const { error: subError } = await supabase.from('subscriptions').insert({
        user_id: req.user_id,
        plano: 'trabalho_rapido',
        valor: req.amount || 1000,
        status: 'ativa',
        data_fim: expiresIso,
      })
      if (subError) console.error('auto-approve: erro ao criar subscrição trabalho_rapido:', subError)
    } else if (req.user_id) {
      const { error: userError } = await supabase.from('users').update({ premium: true }).eq('id', req.user_id)
      if (userError) console.error('auto-approve: erro ao activar premium:', userError)
    }
    approved += 1
  }
  return approved
}

async function approveAds() {
  const store = getStoreWithFallback('paid-ads')
  const raw = await store.get('ads')
  const ads = raw ? JSON.parse(raw) : []
  if (!Array.isArray(ads)) return 0

  const now = new Date()
  let approved = 0
  for (const ad of ads) {
    if (ad.status !== 'pending') continue
    const days = Number(ad.duration_days) || 7
    const expires = new Date(now.getTime() + days * 86400000)
    ad.status = 'approved'
    ad.payment_status = 'paid'
    ad.paid_at = now.toISOString()
    ad.starts_at = now.toISOString()
    ad.expires_at = expires.toISOString()
    ad.updated_at = now.toISOString()
    approved += 1
  }
  if (approved > 0) await store.set('ads', JSON.stringify(ads))
  return approved
}

async function approveAll() {
  const supabase = getAdminClient()
  const [recrutadores, vagas, pagamentos, anuncios] = await Promise.all([
    approveRecruiters(supabase),
    approveVagas(supabase),
    approvePayments(supabase),
    approveAds(),
  ])
  return { recrutadores, vagas, pagamentos, anuncios }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  if (!isScheduledOrInternal(event)) {
    const admin = await verifyAdmin(event)
    if (!admin.isAdmin) {
      return { statusCode: admin.statusCode || 403, headers, body: admin.body || JSON.stringify({ error: 'Forbidden' }) }
    }
  }

  try {
    const results = await approveAll()
    console.log('auto-approve-requests:', JSON.stringify(results))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, ...results }) }
  } catch (err) {
    console.error('auto-approve-requests error:', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: String(err.message || err) }) }
  }
}
