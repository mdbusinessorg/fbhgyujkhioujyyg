const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')
const { createNotification } = require('../lib/notifications')
const { getAdminClient } = require('../lib/supabase-admin')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

async function getAll(store) {
  return JSON.parse((await store.get('all')) || '[]')
}

async function save(store, items) {
  await store.set('all', JSON.stringify(items))
}

async function findOrCreateConversation(userId1, userId2) {
  const supabase = getAdminClient()
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
    .or(`and(participant_1_id.eq.${userId1},participant_2_id.eq.${userId2}),and(participant_1_id.eq.${userId2},participant_2_id.eq.${userId1})`)
    .maybeSingle()
  if (existing) return existing.id
  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({ participant_1_id: userId1, participant_2_id: userId2 })
    .select('id')
    .single()
  if (error) throw error
  return conv.id
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('connections')

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const items = await getAll(store)

    if (params.requester_id && params.recipient_id) {
      const found = items.find(c =>
        (c.requester_id === params.requester_id && c.recipient_id === params.recipient_id) ||
        (c.requester_id === params.recipient_id && c.recipient_id === params.requester_id)
      )
      return { statusCode: 200, headers, body: JSON.stringify(found || null) }
    }

    if (params.user_id) {
      const filtered = items.filter(c => c.requester_id === params.user_id || c.recipient_id === params.user_id)
      return { statusCode: 200, headers, body: JSON.stringify(filtered) }
    }

    return { statusCode: 200, headers, body: JSON.stringify(items) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { requester_id, recipient_id, requester } = payload
    if (!requester_id || !recipient_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'requester_id e recipient_id obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== requester_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = await getAll(store)
    const existing = items.find(c =>
      (c.requester_id === requester_id && c.recipient_id === recipient_id) ||
      (c.requester_id === recipient_id && c.recipient_id === requester_id)
    )
    if (existing) return { statusCode: 200, headers, body: JSON.stringify(existing) }

    const req = {
      id: crypto.randomUUID(),
      requester_id,
      recipient_id,
      status: 'pending',
      created_at: new Date().toISOString(),
      responded_at: null,
      requester: requester || { id: requester_id, nome: 'Utilizador', role: 'candidato' },
    }
    items.push(req)
    await save(store, items)

    await createNotification({
      user_id: recipient_id,
      type: 'network_request',
      title: 'Novo pedido de network',
      body: `${requester?.nome || 'Alguém'} quer conectar contigo`,
      data: { request_id: req.id, requester_id },
      sender: requester || { id: requester_id, nome: 'Utilizador' },
    })

    return { statusCode: 200, headers, body: JSON.stringify(req) }
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { id, status, responder_id } = payload
    if (!id || !status) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id e status obrigatórios' }) }

    const items = await getAll(store)
    const index = items.findIndex(c => c.id === id)
    if (index === -1) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pedido não encontrado' }) }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }

    const req = items[index]
    if (req.recipient_id !== authUser.id && req.requester_id !== authUser.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Sem permissão' }) }
    }

    if (status === 'accepted' && req.recipient_id !== authUser.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Apenas o destinatário pode aceitar' }) }
    }

    items[index].status = status
    items[index].responded_at = new Date().toISOString()
    await save(store, items)

    if (status === 'accepted') {
      const convId = await findOrCreateConversation(req.requester_id, req.recipient_id)
      await createNotification({
        user_id: req.requester_id,
        type: 'network_accepted',
        title: 'Pedido de network aceite',
        body: 'A tua conexão foi aceite. Podes começar a conversar.',
        data: { request_id: req.id, recipient_id: req.recipient_id, conversation_id: convId },
        sender: { id: req.recipient_id, nome: 'Utilizador' },
      })
      return { statusCode: 200, headers, body: JSON.stringify({ ...items[index], conversation_id: convId }) }
    }

    return { statusCode: 200, headers, body: JSON.stringify(items[index]) }
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obrigatório' }) }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser) return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }

    const items = await getAll(store)
    const req = items.find(c => c.id === id)
    if (!req) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pedido não encontrado' }) }
    if (req.requester_id !== authUser.id && req.recipient_id !== authUser.id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Sem permissão' }) }
    }
    await save(store, items.filter(c => c.id !== id))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
