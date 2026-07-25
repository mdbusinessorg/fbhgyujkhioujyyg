const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('community-memberships')

  if (event.httpMethod === 'GET') {
    const params = event.queryStringParameters || {}
    const items = JSON.parse((await store.get('all')) || '[]')
    if (params.user_id) {
      return { statusCode: 200, headers, body: JSON.stringify(items.filter(m => m.user_id === params.user_id)) }
    }
    if (params.area) {
      return { statusCode: 200, headers, body: JSON.stringify(items.filter(m => m.area === params.area)) }
    }
    return { statusCode: 200, headers, body: JSON.stringify(items) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { user_id, area } = payload
    if (!user_id || !area) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id e area obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = JSON.parse((await store.get('all')) || '[]')
    if (!items.find(m => m.user_id === user_id && m.area === area)) {
      items.push({ user_id, area, created_at: new Date().toISOString() })
      await store.set('all', JSON.stringify(items))
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  if (event.httpMethod === 'DELETE') {
    const user_id = event.queryStringParameters?.user_id
    const area = event.queryStringParameters?.area
    if (!user_id || !area) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id e area obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const items = JSON.parse((await store.get('all')) || '[]').filter(m => !(m.user_id === user_id && m.area === area))
    await store.set('all', JSON.stringify(items))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
