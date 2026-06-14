import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwnjigmsuqasvotsksmk.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_d0CD9GsxB4rDVh-SmQUikA_owJjXbAQ'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
