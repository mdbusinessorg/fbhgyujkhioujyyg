const { getStoreWithFallback } = require('../lib/store')
const { getAuthenticatedUser } = require('../lib/auth')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStoreWithFallback('post-comments')

  if (event.httpMethod === 'GET') {
    const postId = event.queryStringParameters?.post_id
    if (!postId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id obrigatório' }) }
    const data = (await store.get(postId)) || '[]'
    const comments = JSON.parse(data)
    return { statusCode: 200, headers, body: JSON.stringify({ post_id: postId, comments }) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { post_id, user_id, content, author } = payload
    if (!post_id || !user_id || !content || !content.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id, user_id e content obrigatórios' }) }
    }

    const authUser = await getAuthenticatedUser(event)
    if (!authUser || authUser.id !== user_id) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Não autenticado' }) }
    }

    const data = (await store.get(post_id)) || '[]'
    const comments = JSON.parse(data)
    const comment = {
      id: crypto.randomUUID(),
      post_id,
      user_id,
      content: content.trim(),
      author: author || { id: user_id, nome: 'Utilizador', role: 'candidato' },
      created_at: new Date().toISOString(),
    }
    comments.push(comment)
    await store.set(post_id, JSON.stringify(comments))
    return { statusCode: 200, headers, body: JSON.stringify({ post_id, comments }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
