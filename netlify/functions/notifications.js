const { getStore } = require('@netlify/blobs')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStore('notifications', {
    siteID: process.env.NETLIFY_BLOBS_SITE_ID,
    token: process.env.NETLIFY_BLOBS_TOKEN,
  })

  const all = async () => {
    const data = (await store.get('all')) || '[]'
    return JSON.parse(data)
  }
  const save = async (items) => store.set('all', JSON.stringify(items))

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const items = await all()
    if (params.user_id) {
      const userItems = items.filter(n => n.user_id === params.user_id).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return { statusCode: 200, headers, body: JSON.stringify(userItems) }
    }
    return { statusCode: 200, headers, body: JSON.stringify(items) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { user_id, type, title, body, data, sender } = payload
    if (!user_id || !type || !title) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id, type e title obrigatórios' }) }

    const items = await all()
    const n = {
      id: crypto.randomUUID(),
      user_id,
      type,
      title,
      body: body || '',
      data: data || {},
      sender: sender || {},
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
    items[index].read = read
    await save(items)
    return { statusCode: 200, headers, body: JSON.stringify(items[index]) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
