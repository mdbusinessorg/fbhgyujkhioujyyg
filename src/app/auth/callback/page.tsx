'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Briefcase } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        // Check if user exists in our users table
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('email', session.user.email)
          .single()

        if (userData) {
          router.push(`/dashboard/${userData.role}/`)
        } else {
          // New Google user — create as candidato
          await supabase.from('users').insert({
            id: session.user.id,
            email: session.user.email,
            nome: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            role: 'candidato',
            aprovado: true
          })
          router.push('/dashboard/candidato/')
        }
      } else {
        router.push('/auth/login/')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-ms-blue flex items-center justify-center px-4 text-white">
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
          <Briefcase size={24} className="text-white" />
        </div>
        <h1 className="text-3xl font-black tracking-tight">MÔ SALO</h1>
        <p className="mt-2 text-sm text-white/80">A processar login...</p>
        <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white" />
      </div>
    </div>
  )
}
