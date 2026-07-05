'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Briefcase } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    })
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Email ou senha incorrectos')
      setLoading(false)
      return
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('email', email)
      .single()

    const role = userData?.role || 'candidato'
    router.push(`/dashboard/${role}/`)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-ms-blue rounded-xl flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
          </div>
          <h1 className="text-[32px] font-bold text-ms-blue">MÔ SALO</h1>
          <p className="text-sm text-ms-gray mt-1">A plataforma de emprego em Angola</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <input
              type="email"
              placeholder="O seu email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              required
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="A sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ms-blue text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'A entrar...' : 'Entrar'}
          </button>

          <div className="text-right">
            <button type="button" className="text-sm text-ms-blue hover:underline">
              Esqueceu a senha?
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-ms-border" />
          <span className="text-sm text-ms-gray">ou</span>
          <div className="flex-1 h-px bg-ms-border" />
        </div>

        {/* Google */}
        <button onClick={handleGoogleLogin} type="button" className="w-full flex items-center justify-center gap-3 border border-ms-border py-3.5 rounded-xl hover:bg-ms-surface transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          <span className="text-sm font-medium text-ms-dark">Continuar com Google</span>
        </button>

        {/* Footer link */}
        <p className="text-center text-sm text-ms-gray mt-6">
          Não tem conta?{' '}
          <Link href="/auth/registar/" className="text-ms-blue font-semibold hover:underline">
            Registar
          </Link>
        </p>
      </div>
    </div>
  )
}
