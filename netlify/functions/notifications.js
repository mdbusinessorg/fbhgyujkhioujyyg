const { getStoreWithFallback } = require('../lib/store')
const { requireUser, rateLimit, rateLimitResponse, clientIp, str } = require('../lib/security')
const { verifyAdmin } = require('../lib/admin')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('notifications')

  const all = async () => {
    const data = (await store.get('all')) || '[]'
    return JSON.parse(data)
  }
  const save = async (items) => store.set('all', JSON.stringify(items))

  if (event.httpMethod === 'GET') {
    const denied = await requireUser(event)
    if (denied.response) return { ...denied.response, headers }

    const params = event.queryStringParameters || {}
    const admin = await verifyAdmin(event)
    const requested = params.user_id
    // Só o dono (ou admin) pode ler notificações — nunca a lista inteira.
    const targetUser = admin.isAdmin ? (requested || denied.user.id) : denied.user.id

    const items = await all()
    const userItems = items
      .filter(n => n.user_id === targetUser)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return { statusCode: 200, headers, body: JSON.stringify(userItems) }
  }

  if (event.httpMethod === 'POST') {
    if (!rateLimit(clientIp(event) + ':notif-post', 30)) return rateLimitResponse(headers)
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { user_id, type, title, body, data, sender } = payload
    if (!user_id || !type || !title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id, type e title obrigatórios' }) }

    // Só o próprio utilizador ou um admin pode criar notificações via API.
    const denied = await requireUser(event, user_id)
    if (denied.response) return { ...denied.response, headers }

    const items = await all()
    const n = {
      id: crypto.randomUUID(),
      user_id,
      type: str(type, 40),
      title: str(title, 200),
      body: str(body || '', 1000),
      data: data && typeof data === 'object' ? data : {},
      sender: sender && typeof sender === 'object' ? sender : {},
      read: false,
      created_at: new Date().toISOString(),
    }
    items.push(n)
    await save(items)
    return { statusCode: 200, headers, body: JSON.stringify(n) }
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { id, read } = payload
    if (!id || typeof read !== 'boolean') return { statusCode: 400, headers, body: JSON.stringify({ error: 'id e read obrigatórios' }) }

    const items = await all()
    const index = items.findIndex(n => n.id === id)
    if (index === -1) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Notificação não encontrada' }) }

    // Só o dono (ou admin) marca a notificação como lida.
    const denied = await requireUser(event, items[index].user_id)
    if (denied.response) return { ...denied.response, headers }

    items[index].read = read
    await save(items)
    return { statusCode: 200, headers, body: JSON.stringify(items[index]) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
