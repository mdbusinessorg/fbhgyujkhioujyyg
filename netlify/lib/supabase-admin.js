const { createClient } = require('@supabase/supabase-js')
const WebSocket = require('ws')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

function getAdminClient() {
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY em falta')
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    realtime: { transport: WebSocket },
  })
}

module.exports = { getAdminClient }
