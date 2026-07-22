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
  created_at: string
  author: PostAuthor
}

export interface MessageRequest {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  requester?: PostAuthor
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

  createPost: (payload: { user_id: string; content: string; author: PostAuthor }): Promise<Post> =>
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

  getRequestBetween: (requester_id: string, recipient_id: string): Promise<MessageRequest | null> =>
    api(`/message-requests?requester_id=${requester_id}&recipient_id=${recipient_id}`),

  createRequest: (payload: { requester_id: string; recipient_id: string; requester: PostAuthor }): Promise<MessageRequest> =>
    api('/message-requests', { method: 'POST', body: JSON.stringify(payload) }),

  updateRequest: (id: string, status: 'accepted' | 'rejected'): Promise<MessageRequest> =>
    api('/message-requests', { method: 'PUT', body: JSON.stringify({ id, status }) }),
}
