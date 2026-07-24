export interface PostAuthor {
  id: string
  nome: string
  avatar_url?: string | null
  role: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_url?: string | null
  created_at: string
  author: PostAuthor
  likes_count?: number
  liked_by_me?: boolean
}

export interface MessageRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester?: PostAuthor
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

const api = async (path: string, options?: RequestInit) => {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
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

  createPost: (payload: { user_id: string; content: string; media_url?: string | null; author: PostAuthor }): Promise<Post> =>
    api('/posts', { method: 'POST', body: JSON.stringify(payload) }),

  deletePost: (id: string, user_id: string): Promise<{ ok: boolean }> =>
    api(`/posts?id=${id}&user_id=${user_id}`, { method: 'DELETE' }),

  getLikes: (post_id: string): Promise<{ post_id: string; likes: string[] }> =>
    api(`/post-likes?post_id=${post_id}`),

  likePost: (post_id: string, user_id: string): Promise<{ post_id: string; likes: string[] }> =>
    api('/post-likes', { method: 'POST', body: JSON.stringify({ post_id, user_id }) }),

  unlikePost: (post_id: string, user_id: string): Promise<{ post_id: string; likes: string[] }> =>
    api('/post-likes', { method: 'DELETE', body: JSON.stringify({ post_id, user_id }) }),

  getRequestsByRecipient: (recipient_id: string): Promise<MessageRequest[]> =>
    api(`/message-requests?recipient_id=${recipient_id}&status=pending`),

  getUserRequests: (user_id: string): Promise<MessageRequest[]> =>
    api(`/message-requests?user_id=${user_id}`),

  getRequestBetween: (requester_id: string, recipient_id: string): Promise<MessageRequest | null> =>
    api(`/message-requests?requester_id=${requester_id}&recipient_id=${recipient_id}`),

  createRequest: (payload: { requester_id: string; recipient_id: string; requester: PostAuthor }): Promise<MessageRequest> =>
    api('/message-requests', { method: 'POST', body: JSON.stringify(payload) }),

  updateRequest: (id: string, status: 'accepted' | 'rejected'): Promise<MessageRequest> =>
    api('/message-requests', { method: 'PUT', body: JSON.stringify({ id, status }) }),

  getNotifications: (user_id: string): Promise<Notification[]> =>
    api(`/notifications?user_id=${user_id}`),

  createNotification: (payload: Omit<Notification, 'id' | 'read' | 'created_at'>): Promise<Notification> =>
    api('/notifications', { method: 'POST', body: JSON.stringify(payload) }),

  markNotificationRead: (id: string): Promise<Notification> =>
    api('/notifications', { method: 'PUT', body: JSON.stringify({ id, read: true }) }),
}
