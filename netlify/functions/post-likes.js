const { getStore } = require('@netlify/blobs')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const store = getStore('post-likes')

  if (event.httpMethod === 'GET') {
    const postId = event.queryStringParameters?.post_id
    if (!postId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id obrigatório' }) }
    const data = (await store.get(postId)) || '[]'
    const likes = JSON.parse(data)
    return { statusCode: 200, headers, body: JSON.stringify({ post_id: postId, likes }) }
  }

  if (event.httpMethod === 'POST') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { post_id, user_id } = payload
    if (!post_id || !user_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id e user_id obrigatórios' }) }

    const data = (await store.get(post_id)) || '[]'
    const likes = JSON.parse(data)
    if (!likes.includes(user_id)) likes.push(user_id)
    await store.set(post_id, JSON.stringify(likes))
    return { statusCode: 200, headers, body: JSON.stringify({ post_id, likes }) }
  }

  if (event.httpMethod === 'DELETE') {
    let payload = {}
    try { payload = JSON.parse(event.body || '{}') } catch {}
    const { post_id, user_id } = payload
    if (!post_id || !user_id) return { statusCode: 400, headers, body: JSON.stringify({ error: 'post_id e user_id obrigatórios' }) }

    const data = (await store.get(post_id)) || '[]'
    let likes = JSON.parse(data)
    likes = likes.filter(id => id !== user_id)
    await store.set(post_id, JSON.stringify(likes))
    return { statusCode: 200, headers, body: JSON.stringify({ post_id, likes }) }
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
}
