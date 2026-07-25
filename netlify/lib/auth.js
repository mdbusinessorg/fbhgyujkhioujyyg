const { createClient } = require('@supabase/supabase-js')
const WebSocket = require('ws')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d0CD9GsxB4rDVh-SmQUikA_owJjXbAQ'

async function getAuthenticatedUser(event) {
  const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization)
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null
  const token = authHeader.replace('Bearer ', '').trim()
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null
  const email = data.user.email
  if (!email) return null
  const { data: userRow } = await supabase.from('users').select('id, nome, email, role, avatar_url').eq('email', email).single()
  if (!userRow) return null
  return userRow
}

module.exports = { getAuthenticatedUser }
