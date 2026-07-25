const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('follows')

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const items = JSON.parse((await store.get('all')) || '[]')
    if (params.follower_id) {
      return { statusCode: 200, headers, body: JSON.stringify(items.filter(f => f.follower_id === params.follower_id)) }
    }
    if (params.following_id) {
      return { statusCode: 200, headers, body: JSON.stringify(items.filter(f => f.following_id === params.following_id)) }
    }
    return { statusCode: 200, headers, body: JSON.stringify(items) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { follower_id, following_id } = payload
    if (!follower_id || !following_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'follower_id e following_id obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== follower_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = JSON.parse((await store.get('all')) || '[]')
    if (!items.find(f => f.follower_id === follower_id && f.following_id === following_id)) {
      items.push({ follower_id, following_id, created_at: new Date().toISOString() })
      await store.set('all', JSON.stringify(items))
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  if (event.httpMethod === 'DELETE') {
    const follower_id = event.queryStringParameters?.follower_id
    const following_id = event.queryStringParameters?.following_id
    if (!follower_id || !following_id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'follower_id e following_id obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== follower_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = JSON.parse((await store.get('all')) || '[]').filter(f => !(f.follower_id === follower_id && f.following_id === following_id))
    await store.set('all', JSON.stringify(items))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
