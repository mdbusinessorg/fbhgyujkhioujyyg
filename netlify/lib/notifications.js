const { getStoreWithFallback } = require('./store')

async function createNotification(payload) {
  const store = getStoreWithFallback('notifications')
  const items = JSON.parse((await store.get('all')) || '[]')
  items.push({
    id: crypto.randomUUID(),
    user_id: payload.user_id,
    type: payload.type,
    title: payload.title,
    body: payload.body || '',
    data: payload.data || {},
    sender: payload.sender || {},
    read: false,
    created_at: new Date().toISOString(),
  })
  await store.set('all', JSON.stringify(items))
}

module.exports = { createNotification }
