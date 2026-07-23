const { getStore } = require('@netlify/blobs')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStore('message-requests', {
    siteID: process.env.NETLIFY_BLOBS_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  })
  const all = async () => {
    const data = (await store.get('all')) || '[]'
    return JSON.parse(data)
  }
  const save = async (requests) => store.set('all', JSON.stringify(requests))

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const requests = await all()

    if (params.user_id) {
      const filtered = requests.filter(r => r.requester_id === params.user_id || r.recipient_id === params.user_id)
      return { statusCode: 200, headers, body: JSON.stringify(filtered) }
    }

    if (params.recipient_id) {
      const status = params.status || 'pending'
      const filtered = requests.filter(r => r.recipient_id === params.recipient_id && r.status === status)
      return { statusCode: 200, headers, body: JSON.stringify(filtered) }
    }

    if (params.requester_id && params.recipient_id) {
      const found = requests.find(r =>
        (r.requester_id === params.requester_id && r.recipient_id === params.recipient_id) ||
        (r.requester_id === params.recipient_id && r.recipient_id === params.requester_id)
      )
      return { statusCode: 200, headers, body: JSON.stringify(found || null) }
    }

    return { statusCode: 200, headers, body: JSON.stringify(requests) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { requester_id, recipient_id, requester } = payload
    if (!requester_id || !recipient_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'requester_id e recipient_id obrigatórios' }) }

    const requests = await all()
    const existing = requests.find(r =>
      (r.requester_id === requester_id && r.recipient_id === recipient_id) ||
      (r.requester_id === recipient_id && r.recipient_id === requester_id)
    )
    if (existing) return { statusCode: 200, headers, body: JSON.stringify(existing) }

    const req = {
      id: crypto.randomUUID(),
      requester_id,
      recipient_id,
      status: 'pending',
      created_at: new Date().toISOString(),
      requester: requester || { id: requester_id, nome: 'Utilizador' },
    }
    requests.push(req)
    await save(requests)
    return { statusCode: 200, headers, body: JSON.stringify(req) }
  }

  if (event.httpMethod === 'PUT' || event.httpMethod === 'PATCH') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { id, status } = payload
    if (!id || !status) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id e status obrigatórios' }) }

    const requests = await all()
    const index = requests.findIndex(r => r.id === id)
    if (index === -1) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Pedido não encontrado' }) }
    requests[index].status = status
    await save(requests)
    return { statusCode: 200, headers, body: JSON.stringify(requests[index]) }
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id
    if (!id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obrigatório' }) }
    let requests = await all()
    requests = requests.filter(r => r.id !== id)
    await save(requests)
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
