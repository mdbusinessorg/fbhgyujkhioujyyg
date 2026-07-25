import { supabase } from '@/lib/supabase'

export interface PostAuthor {
  id: string
  nome: string
  avatar_url?: string | null
  role: string
  area?: string
  localizacao?: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_url?: string | null
  type: 'post' | 'job' | 'share'
  vaga_id?: string | null
  is_featured_job: boolean
  area?: string
  created_at: string
  author: PostAuthor
  gosto_count?: number
  parabens_count?: number
  comments_count?: number
  liked_by_me?: boolean
  reactions?: { user_id: string; type: string; created_at: string }[]
  comments?: PostComment[]
  is_connected?: boolean
  is_followed?: boolean
  is_verified?: boolean
  vaga?: any
  score?: number
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  author: PostAuthor
  created_at: string
}

export interface Connection {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  responded_at?: string
  requester?: PostAuthor
  conversation_id?: string
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: 'network_request' | 'network_accepted' | 'message' | 'job_match'
  title: string
  body: string
  data?: Record<string, any>
  sender?: PostAuthor
  read: boolean
  created_at: string
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {}
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  return headers
}

const api = async (path: string, options?: RequestInit) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    let err: any = { error: text || 'Erro' }
    try { err = JSON.parse(text) } catch {}
    throw new Error(err.error || 'Erro na API')
  }
  return res.json()
}

export const social = {
  getPosts: (): Promise<Post[]> => api('/posts'),

  createPost: (payload: { user_id: string; content: string; media_url?: string | null; author: PostAuthor; type?: 'post' | 'job'; vaga_id?: string | null; is_featured_job?: boolean; area?: string }): Promise<Post> =>
    api('/posts', { method: 'POST', body: JSON.stringify(payload) }),

  deletePost: (id: string, user_id: string): Promise<{ ok: boolean }> =>
    api(`/posts?id=${id}&user_id=${user_id}`, { method: 'DELETE' }),

  getReactions: (post_id: string): Promise<{ post_id: string; reactions: { user_id: string; type: string; created_at: string }[] }> =>
    api(`/post-reactions?post_id=${post_id}`),

  reactPost: (post_id: string, user_id: string, type: 'gosto' | 'parabens' = 'gosto'): Promise<{ post_id: string; reactions: any[] }> =>
    api('/post-reactions', { method: 'POST', body: JSON.stringify({ post_id, user_id, type }) }),

  unreactPost: (post_id: string, user_id: string): Promise<{ post_id: string; reactions: any[] }> =>
    api('/post-reactions', { method: 'DELETE', body: JSON.stringify({ post_id, user_id }) }),

  getComments: (post_id: string): Promise<{ post_id: string; comments: PostComment[] }> =>
    api(`/post-comments?post_id=${post_id}`),

  createComment: (payload: { post_id: string; user_id: string; content: string; author: PostAuthor }): Promise<{ post_id: string; comments: PostComment[] }> =>
    api('/post-comments', { method: 'POST', body: JSON.stringify(payload) }),

  getFeed: (tab: string, user_id?: string, limit = 20, offset = 0, author_id?: string): Promise<{ tab: string; total: number; posts: Post[] }> =>
    api(`/feed?tab=${tab}&user_id=${user_id || ''}&limit=${limit}&offset=${offset}${author_id ? `&author_id=${author_id}` : ''}`),

  getConnections: (user_id: string): Promise<Connection[]> =>
    api(`/connections?user_id=${user_id}`),

  getConnectionBetween: (requester_id: string, recipient_id: string): Promise<Connection | null> =>
    api(`/connections?requester_id=${requester_id}&recipient_id=${recipient_id}`),

  createConnection: (payload: { requester_id: string; recipient_id: string; requester: PostAuthor }): Promise<Connection> =>
    api('/connections', { method: 'POST', body: JSON.stringify(payload) }),

  updateConnection: (id: string, status: 'accepted' | 'rejected'): Promise<Connection> =>
    api('/connections', { method: 'PUT', body: JSON.stringify({ id, status }) }),

  deleteConnection: (id: string): Promise<{ ok: boolean }> =>
    api(`/connections?id=${id}`, { method: 'DELETE' }),

  getFollows: (follower_id: string): Promise<Follow[]> =>
    api(`/follows?follower_id=${follower_id}`),

  follow: (follower_id: string, following_id: string): Promise<{ ok: boolean }> =>
    api('/follows', { method: 'POST', body: JSON.stringify({ follower_id, following_id }) }),

  unfollow: (follower_id: string, following_id: string): Promise<{ ok: boolean }> =>
    api(`/follows?follower_id=${follower_id}&following_id=${following_id}`, { method: 'DELETE' }),

  getNotifications: (user_id: string): Promise<Notification[]> =>
    api(`/notifications?user_id=${user_id}`),

  createNotification: (payload: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<Notification> =>
    api('/notifications', { method: 'POST', body: JSON.stringify(payload) }),

  markNotificationRead: (id: string): Promise<Notification> =>
    api('/notifications', { method: 'PUT', body: JSON.stringify({ id, read: true }) }),

  requestRecruiterVerification: (payload: { user_id: string; email: string; company_name?: string }): Promise<any> =>
    api('/recruiter-verification', { method: 'POST', body: JSON.stringify({ ...payload, action: 'request' }) }),

  verifyRecruiter: (user_id: string, code: string): Promise<any> =>
    api('/recruiter-verification', { method: 'POST', body: JSON.stringify({ action: 'verify', user_id, code }) }),

  getRecruiterVerification: (user_id: string): Promise<any> =>
    api(`/recruiter-verification?user_id=${user_id}`),
}
