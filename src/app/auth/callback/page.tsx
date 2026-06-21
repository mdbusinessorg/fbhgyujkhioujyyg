'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-ms-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-ms-gray">A processar login...</p>
      </div>
    </div>
  )
}
