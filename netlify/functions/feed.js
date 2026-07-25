const { getStoreWithFallback } = require('../lib/store')
const { getAdminClient } = require('../lib/supabase-admin')

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
}

function hoursAgo(iso) {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

function rankScore(post, context) {
  const { userArea, connectedIds, followingIds } = context
  const hours = hoursAgo(post.created_at)
  const timeScore = 1 / Math.pow(hours + 2, 1.5)
  const reactions = post.reactions || []
  const comments = post.comments || []
  const counts = post.reaction_counts || {}
  const gosto = counts.gosto || 0
  const mood = counts.mood || 0
  const suporte = counts.suporte || 0
  const adoro = counts.adoro || 0
  // algoritmo benéfico: suporte e adoro pesam mais para promover conteúdo que ajuda
  const engagement = gosto + mood + suporte * 2 + adoro * 2 + comments.length * 2
  const engagementScore = Math.log1p(engagement + 1)
  const isConnected = connectedIds.has(post.user_id)
  const isFollowing = followingIds.has(post.user_id)
  const networkBoost = isConnected ? 3 : isFollowing ? 1.5 : 1
  const authorArea = post.area || post.author?.area || ''
  const areaBoost = userArea && authorArea && userArea.toLowerCase() === authorArea.toLowerCase() ? 2 : 1
  const typeBoost = post.type === 'job' || post.is_featured_job ? 1.2 : 1
  // boost benéfico para publicações que pedem ajuda/oferecem apoio
  const helpful = /ajuda|oportunidade|apoio|voluntariado|mentoria|dica/i.test(post.content || '')
  const helpfulBoost = helpful ? 1.3 : 1
  return timeScore * (1 + engagementScore) * networkBoost * areaBoost * typeBoost * helpfulBoost
}

function ensureDiversity(sorted) {
  const result = []
  const deferred = []
  const authorCountsInTail = (post) => {
    const idx = result.length
    if (idx < 2) return 0
    let count = 0
    for (let i = idx - 1; i >= Math.max(0, idx - 2); i--) {
      if (result[i].user_id === post.user_id) count++
    }
    return count
  }

  for (const post of sorted) {
    if (authorCountsInTail(post) >= 2) {
      deferred.push(post)
    } else {
      result.push(post)
    }
  }

  for (const post of deferred) {
    result.push(post)
  }

  return result
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const params = event.queryStringParameters || {}
  const tab = params.tab || 'para-ti'
  const userId = params.user_id || null
  const authorId = params.author_id || null
  const limit = Math.min(parseInt(params.limit || '20', 10), 100)
  const offset = Math.max(parseInt(params.offset || '0', 10), 0)

  const postsStore = getStoreWithFallback('posts')
  const reactionsStore = getStoreWithFallback('post-reactions')
  const commentsStore = getStoreWithFallback('post-comments')
  const connectionsStore = getStoreWithFallback('connections')
  const followsStore = getStoreWithFallback('follows')
  const verificationsStore = getStoreWithFallback('recruiter-verifications')

  const [postsRaw, connections, follows, verifications] = await Promise.all([
    postsStore.get('all').then(d => JSON.parse(d || '[]')),
    connectionsStore.get('all').then(d => JSON.parse(d || '[]')),
    followsStore.get('all').then(d => JSON.parse(d || '[]')),
    verificationsStore.get('all').then(d => JSON.parse(d || '[]')),
  ])

  const connectedIds = new Set()
  const followingIds = new Set()
  if (userId) {
    connections.filter(c => c.status === 'accepted').forEach(c => {
      if (c.requester_id === userId) connectedIds.add(c.recipient_id)
      if (c.recipient_id === userId) connectedIds.add(c.requester_id)
    })
    follows.filter(f => f.follower_id === userId).forEach(f => followingIds.add(f.following_id))
  }

  const verifiedIds = new Set(verifications.filter(v => v.verified_at).map(v => v.user_id))

  let userArea = ''
  let userProfile = null
  let allUsers = []
  let allProfiles = []
  let vagasMap = {}

  try {
    const supabase = getAdminClient()
    const { data: users } = await supabase.from('users').select('id, nome, email, role, avatar_url').limit(1000)
    const { data: profiles } = await supabase.from('profiles').select('user_id, area, localizacao, bio, nivel_academico, experiencias, competencias').limit(1000)
    allUsers = users || []
    allProfiles = profiles || []
    if (userId) {
      userProfile = allProfiles.find(p => p.user_id === userId)
      userArea = userProfile?.area || ''
    }

    const vagaIds = postsRaw.map(p => p.vaga_id).filter(Boolean)
    if (vagaIds.length > 0) {
      const { data: vagas } = await supabase.from('vagas').select('id, titulo, empresa_nome, localizacao, area, descricao').in('id', vagaIds)
      ;(vagas || []).forEach(v => { vagasMap[v.id] = v })
    }
  } catch (err) {
    console.error('Supabase fetch error', err.message)
  }

  const usersMap = {}
  allUsers.forEach(u => { usersMap[u.id] = u })
  const profilesMap = {}
  allProfiles.forEach(p => { profilesMap[p.user_id] = p })

  const enrichedPosts = await Promise.all(postsRaw.map(async (post) => {
    const [reactionsData, commentsData] = await Promise.all([
      reactionsStore.get(post.id).then(d => JSON.parse(d || '[]')).catch(() => []),
      commentsStore.get(post.id).then(d => JSON.parse(d || '[]')).catch(() => []),
    ])

    const user = usersMap[post.user_id] || {}
    const profile = profilesMap[post.user_id] || {}
    const author = {
      id: post.user_id,
      nome: post.author?.nome || user.nome || 'Utilizador',
      avatar_url: post.author?.avatar_url || user.avatar_url || null,
      role: post.author?.role || user.role || 'candidato',
      area: profile.area || post.area || post.author?.area || '',
      localizacao: profile.localizacao || '',
      bio: profile.bio || '',
    }

    const vaga = post.vaga_id ? vagasMap[post.vaga_id] : null

    const reaction_counts = {}
    for (const type of ['gosto', 'mood', 'suporte', 'adoro']) {
      reaction_counts[type] = reactionsData.filter(r => r.type === type).length
    }

    return {
      ...post,
      author,
      area: author.area,
      reactions: reactionsData,
      comments: commentsData,
      reaction_counts: reaction_counts,
      my_reaction: userId ? (reactionsData.find(r => r.user_id === userId)?.type || null) : null,
      comments_count: commentsData.length,
      is_connected: userId ? connectedIds.has(post.user_id) : false,
      is_followed: userId ? followingIds.has(post.user_id) : false,
      is_verified: user.role === 'recrutador' && verifiedIds.has(post.user_id),
      vaga,
    }
  }))

  let filtered = enrichedPosts
  if (authorId) {
    filtered = enrichedPosts.filter(p => p.user_id === authorId)
  } else if (tab === 'rede') {
    filtered = enrichedPosts.filter(p => connectedIds.has(p.user_id) || p.user_id === userId)
  } else if (tab === 'empresas') {
    filtered = enrichedPosts.filter(p => followingIds.has(p.user_id) || p.user_id === userId)
  } else if (tab === 'vagas-em-alta') {
    filtered = enrichedPosts.filter(p => p.type === 'job' || p.is_featured_job || p.vaga_id)
  }

  const context = { userArea, connectedIds, followingIds }
  let sorted = filtered.map(p => ({ ...p, score: rankScore(p, context) })).sort((a, b) => b.score - a.score)

  if (authorId || tab === 'rede' || tab === 'empresas') {
    sorted = filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }

  sorted = ensureDiversity(sorted)

  const paginated = sorted.slice(offset, offset + limit)

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      tab,
      total: sorted.length,
      posts: paginated,
    }),
  }
}
