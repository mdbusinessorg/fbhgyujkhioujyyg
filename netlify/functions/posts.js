const { getStore } = require('@netlify/blobs')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStore('posts')

  if (event.httpMethod === 'GET') {
    const data = (await store.get('all')) || '[]'
    const posts = JSON.parse(data)
    return { statusCode: 200, headers, body: JSON.stringify(posts) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { user_id, content, author } = payload
    if (!user_id || !content || !content.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'user_id e content obrigatórios' }) }
    }

    const data = (await store.get('all')) || '[]'
    const posts = JSON.parse(data)
    const today = startOfDay(new Date())
    const already = posts.find(p => p.user_id === user_id && startOfDay(p.created_at) >= today)
    if (already) {
      return { statusCode: 429, headers, body: JSON.stringify({ error: 'Só podes publicar uma vez por dia' }) }
    }

    const post = {
      id: crypto.randomUUID(),
      user_id,
      content: content.trim(),
      created_at: new Date().toISOString(),
      author: author || { id: user_id, nome: 'Utilizador', role: 'candidato' },
    }
    posts.unshift(post)
    await store.set('all', JSON.stringify(posts))
    return { statusCode: 200, headers, body: JSON.stringify(post) }
  }

  if (event.httpMethod === 'DELETE') {
    const id = event.queryStringParameters?.id
    const user_id = event.queryStringParameters?.user_id
    if (!id) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'id obrigatório' }) }
    }

    const data = (await store.get('all')) || '[]'
    let posts = JSON.parse(data)
    const post = posts.find(p => p.id === id)
    if (post && post.user_id !== user_id) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Não autorizado' }) }
    }
    posts = posts.filter(p => p.id !== id)
    await store.set('all', JSON.stringify(posts))
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
