// Aprovação automática de pedidos pendentes do MÔ SALO.
// Cobre: recrutadores por aprovar, vagas em análise, pedidos de pagamento e anúncios pagos.
// Corre por schedule (Netlify Clockwork) e pode ser disparado manualmente por um admin.
const { getAdminClient } = require('../lib/supabase-admin')
const { getStoreWithFallback } = require('../lib/store')
const { verifyAdmin } = require('../lib/admin')
const { isScheduledOrInternal } = require('../lib/security')
const { emailConfigured, sendEmail } = require('../lib/email')

const MATIAS_EMAIL = 'matiasdomingos158@gmail.com'
const ADMIN_URL = 'https://mosalo.eu.cc/dashboard/admin/'

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

// Pagamentos ficam SEMPRE pendentes até confirmação manual do admin.
// Aqui só enviamos um alerta vermelho por email (uma vez por pedido).
async function notifyPendingPayments(supabase) {
  const { data: pending, error } = await supabase
    .from('payment_requests')
    .select('*')
    .eq('status', 'pending')
  if (error) throw new Error(`pagamentos: ${error.message}`)
  const list = pending || []
  if (list.length === 0) return { pendentes: 0, notificados: 0 }

  if (!emailConfigured()) {
    console.warn('auto-approve-requests: email não configurado — alerta de pagamento não enviado')
    return { pendentes: list.length, notificados: 0 }
  }

  const userIds = [...new Set(list.map((r) => r.user_id).filter(Boolean))]
  const usersById = {}
  if (userIds.length) {
    const { data: users } = await supabase.from('users').select('id, nome, email').in('id', userIds)
    for (const u of users || []) usersById[u.id] = u
  }

  const store = getStoreWithFallback('auto-approve-payment-alerts')
  let notifiedMap = {}
  try { notifiedMap = JSON.parse((await store.get('notified')) || '{}') } catch {}

  let sent = 0
  for (const req of list) {
    if (notifiedMap[req.id]) continue
    const user = usersById[req.user_id] || {}
    const plan = req.plan || req.plano || 'Premium'
    const amount = req.amount != null ? `${req.amount} Kz` : '—'
    const proof = req.proof_file_url
      ? `<p style="margin:12px 0 0;"><a href="${req.proof_file_url}" style="color:#EF4444;font-weight:700;">Ver comprovativo</a></p>`
      : ''
    const ref = req.transaction_reference
      ? `<p style="margin:8px 0 0;color:#5B6472;font-size:13px;">Referência: <strong>${req.transaction_reference}</strong></p>`
      : ''
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#F5F7FA;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#EF4444;border-radius:18px 18px 0 0;padding:24px;text-align:center;">
    <div style="color:#fff;font-size:22px;font-weight:800;">PAGAMENTO PENDENTE</div>
    <div style="color:#FFD6D6;font-size:13px;margin-top:4px;">Confirma manualmente para activar o premium</div>
  </div>
  <div style="background:#fff;border:1px solid #F0E2E2;border-radius:0 0 18px 18px;padding:24px;">
    <table style="width:100%;font-size:14px;color:#1A1A2E;border-collapse:collapse;">
      <tr><td style="padding:6px 0;color:#757575;">Utilizador</td><td style="padding:6px 0;font-weight:700;">${user.nome || ''} ${user.email ? `(${user.email})` : ''}</td></tr>
      <tr><td style="padding:6px 0;color:#757575;">Plano</td><td style="padding:6px 0;font-weight:700;">${plan}</td></tr>
      <tr><td style="padding:6px 0;color:#757575;">Valor</td><td style="padding:6px 0;font-weight:800;color:#EF4444;">${amount}</td></tr>
      <tr><td style="padding:6px 0;color:#757575;">Data</td><td style="padding:6px 0;">${new Date(req.created_at).toLocaleString('pt-AO')}</td></tr>
    </table>
    ${proof}${ref}
    <div style="margin-top:20px;text-align:center;">
      <a href="${ADMIN_URL}" style="display:inline-block;background:#EF4444;color:#fff;font-weight:700;padding:12px 28px;border-radius:999px;text-decoration:none;">Confirmar pagamento</a>
    </div>
  </div>
</div></body></html>`
    try {
      await sendEmail({
        to: { email: MATIAS_EMAIL, nome: 'Matias' },
        subject: `Pagamento pendente — ${plan} ${amount}`,
        html,
      })
      notifiedMap[req.id] = true
      sent += 1
    } catch (err) {
      console.error('auto-approve-requests: falha ao enviar alerta de pagamento:', err)
    }
  }

  try { await store.set('notified', JSON.stringify(notifiedMap)) } catch {}
  return { pendentes: list.length, notificados: sent }
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
    notifyPendingPayments(supabase),
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
