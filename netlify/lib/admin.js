const { createClient } = require('@supabase/supabase-js')
const WebSocket = require('ws')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d0CD9GsxB4rDVh-SmQUikA_owJjXbAQ'

async function verifyAdmin(event) {
  const authHeader = event.headers && (event.headers.authorization || event.headers.Authorization)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isAdmin: false, statusCode: 401, body: JSON.stringify({ error: 'Token em falta' }) }
  }

  const token = authHeader.replace('Bearer ', '').trim()
  if (!SUPABASE_ANON_KEY) {
    return { isAdmin: false, statusCode: 500, body: JSON.stringify({ error: 'Chave Supabase em falta' }) }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) {
    return { isAdmin: false, statusCode: 401, body: JSON.stringify({ error: 'Token inválido' }) }
  }

  const userId = data.user.id
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  if (userError || !userRow || userRow.role !== 'admin') {
    return { isAdmin: false, statusCode: 403, body: JSON.stringify({ error: 'Acesso restrito a administradores' }) }
  }

  return { isAdmin: true, userId }
}

module.exports = { verifyAdmin }
