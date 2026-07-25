const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('user-photos')
  const userId = event.queryStringParameters?.user_id

  if (event.httpMethod === 'GET') {
    if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id obrigatório' }) }
    const data = (await store.get(userId)) || '{}'
    return { statusCode: 200, headers, body: data }
  }

  if (event.httpMethod === 'POST' || event.httpMethod === 'PUT') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { user_id, type, url } = payload
    if (!user_id || !['avatar', 'cover'].includes(type)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id e type válidos obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const data = JSON.parse((await store.get(user_id)) || '{}')
    data[type === 'avatar' ? 'avatar_url' : 'cover_url'] = url || null
    await store.set(user_id, JSON.stringify(data))
    return { statusCode: 200, headers, body: JSON.stringify(data) }
  }

  if (event.httpMethod === 'DELETE') {
    if (!userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id obrigatório' }) }
    const type = event.queryStringParameters?.type
    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }
    const data = JSON.parse((await store.get(userId)) || '{}')
    if (type === 'avatar') delete data.avatar_url
    if (type === 'cover') delete data.cover_url
    await store.set(userId, JSON.stringify(data))
    return { statusCode: 200, headers, body: JSON.stringify(data) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
