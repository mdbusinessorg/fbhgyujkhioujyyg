const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')
const crypto = require('crypto')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function active(items) {
  const now = new Date().toISOString()
  return (items || []).filter(s => !s.expires_at || s.expires_at > now)
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('statuses')

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    let items = active(JSON.parse((await store.get('all')) || '[]'))
    if (params.user_id) items = items.filter(s => s.user_id === params.user_id)
    return { statusCode: 200, headers, body: JSON.stringify(items) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { user_id, content, media_url, author } = payload
    if (!user_id || (!content && !media_url)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id e conteúdo/mídia obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = active(JSON.parse((await store.get('all')) || '[]'))
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const recent = items.filter(s => s.user_id === user_id && s.created_at > dayAgo)
    if (recent.length > 0) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Apenas um estado por dia. Apaga o atual para publicar outro.' }) }
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const status = {
      id: crypto.randomUUID(),
      user_id,
      content: content || '',
      media_url: media_url || null,
      author: author || {},
      created_at: new Date().toISOString(),
      expires_at: expires,
      views: [],
    }
    items.push(status)
    await store.set('all', JSON.stringify(items))
    return { statusCode: 200, headers, body: JSON.stringify(status) }
  }

  if (event.httpMethod === 'PUT') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { status_id, user_id, nome, avatar_url } = payload
    if (!status_id || !user_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'status_id e user_id obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    let items = JSON.parse((await store.get('all')) || '[]')
    items = items.map(s => {
      if (s.id !== status_id || s.user_id === user_id) return s
      if (!s.views) s.views = []
      if (!s.views.find(v => v.user_id === user_id)) {
        s.views.push({ user_id, nome: nome || '', avatar_url: avatar_url || null, created_at: new Date().toISOString() })
      }
      return s
    })
    await store.set('all', JSON.stringify(items))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  if (event.httpMethod === 'DELETE') {
    const status_id = event.queryStringParameters?.status_id
    const user_id = event.queryStringParameters?.user_id
    if (!status_id || !user_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'status_id e user_id obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = JSON.parse((await store.get('all')) || '[]').filter(s => !(s.id === status_id && s.user_id === user_id))
    await store.set('all', JSON.stringify(items))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
