const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function extractDomain(email) {
  return email.split('@')[1]?.toLowerCase() || ''
}

function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000))
}

async function sendEmail(to, subject, text) {
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return { sent: false, reason: 'RESEND_API_KEY não configurada' }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'MÔ SALO <noreply@mosalo.eu.cc>', to, subject, text }),
    })
    if (res.ok) return { sent: true }
    const err = await res.text()
    return { sent: false, reason: err }
  } catch (e) {
    return { sent: false, reason: e.message }
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('recruiter-verifications')

  if (event.httpMethod === 'GET') {
    const userId = event.queryStringParameters?.user_id
    if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id obrigatório' }) }
    const items = JSON.parse((await store.get('all')) || '[]')
    const verified = items.find(v => v.user_id === userId && v.verified_at)
    return { statusCode: 200, headers, body: JSON.stringify({ verified: !!verified, record: verified || null }) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { action, user_id, email, company_name } = payload

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = JSON.parse((await store.get('all')) || '[]')

    if (action === 'request') {
      if (!email || !email.includes('@')) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email corporativo inválido' }) }
      }
      if (authUser.role !== 'recrutador' && authUser.role !== 'admin') {
        return { statusCode: 403, headers, body: JSON.stringify({ error: 'Apenas recrutadores podem pedir verificação' }) }
      }

      const domain = extractDomain(email)
      const code = generateCode()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

      const existingIndex = items.findIndex(v => v.user_id === user_id)
      const record = {
        id: crypto.randomUUID(),
        user_id,
        email,
        company_name: company_name || domain.split('.')[0] || 'Empresa',
        company_domain: domain,
        code,
        expires_at: expiresAt,
        verified_at: null,
        created_at: new Date().toISOString(),
      }
      if (existingIndex >= 0) items[existingIndex] = record
      else items.push(record)
      await store.set('all', JSON.stringify(items))

      const emailResult = await sendEmail(email, 'Código de verificação MÔ SALO', `O teu código de verificação é: ${code}\n\nVálido por 24 horas.`)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          requested: true,
          email_sent: emailResult.sent,
          email_status: emailResult.reason || 'enviado',
          code: emailResult.sent ? undefined : code,
          expires_at: expiresAt,
        }),
      }
    }

    if (action === 'verify') {
      const { code } = payload
      if (!code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código obrigatório' }) }

      const record = items.find(v => v.user_id === user_id)
      if (!record) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pedido de verificação não encontrado' }) }
      if (new Date(record.expires_at) < new Date()) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código expirado' }) }
      if (record.code !== code) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Código inválido' }) }

      record.verified_at = new Date().toISOString()
      await store.set('all', JSON.stringify(items))
      return { statusCode: 200, headers, body: JSON.stringify({ verified: true, record }) }
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Ação desconhecida' }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
