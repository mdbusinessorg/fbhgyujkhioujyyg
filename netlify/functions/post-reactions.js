const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

const VALID_REACTIONS = ['gosto', 'mood', 'suporte', 'adoro']

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('post-reactions')

  if (event.httpMethod === 'GET') {
    const postId = event.queryStringParameters?.post_id
    if (!postId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id obrigatório' }) }
    const data = (await store.get(postId)) || '[]'
    const reactions = JSON.parse(data)
    return { statusCode: 200, headers, body: JSON.stringify({ post_id: postId, reactions }) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { post_id, user_id, type = 'gosto' } = payload
    if (!post_id || !user_id || !VALID_REACTIONS.includes(type)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id, user_id e tipo válidos obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const data = (await store.get(post_id)) || '[]'
    const reactions = JSON.parse(data)
    const existingIndex = reactions.findIndex(r => r.user_id === user_id)
    if (existingIndex >= 0) {
      reactions[existingIndex].type = type
      reactions[existingIndex].created_at = new Date().toISOString()
    } else {
      reactions.push({ user_id, type, created_at: new Date().toISOString() })
    }
    await store.set(post_id, JSON.stringify(reactions))
    return { statusCode: 200, headers, body: JSON.stringify({ post_id, reactions }) }
  }

  if (event.httpMethod === 'DELETE') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { post_id, user_id } = payload
    if (!post_id || !user_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id e user_id obrigatórios' }) }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const data = (await store.get(post_id)) || '[]'
    const reactions = JSON.parse(data).filter(r => r.user_id !== user_id)
    await store.set(post_id, JSON.stringify(reactions))
    return { statusCode: 200, headers, body: JSON.stringify({ post_id, reactions }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
