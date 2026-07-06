'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Briefcase } from 'lucide-react'
import AuthIllustration from '@/components/AuthIllustration'

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

    const { data, error: authError } = await supabase.auth.signInWithPassword({
email, password })
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
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-2">
      <section className="flex items-center justify-center bg-ms-blue px-4 py-8 text-white lg:min-h-screen lg:px-10 lg:py-12">
        <div className="w-full max-w-xl text-center">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <Briefcase size={24} className="text-white" />
          </div>
          <h1 className="mx-auto max-w-md text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Encontra o teu próximo EMPREGO
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Candidata-te de forma simples, acompanha as tuas vagas e mantém o teu perfil pronto para oportunidades reais.
          </p>
          <div className="mx-auto mt-8 flex justify-center">
            <AuthIllustration />
          </div>
          <div className="mx-auto mt-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90">
            Vagas em Angola, num só lugar
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-8 lg:min-h-screen lg:px-10 lg:py-12">
        <div className="w-full max-w-md">
          <div className="mb-6 overflow-hidden rounded-[28px] bg-white shadow-[0_18px_50px_rgba(17,24,39,0.08)] lg:shadow-none">
            <div className="bg-ms-blue px-6 py-7 text-white lg:hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">
                  <Briefcase size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-xs font-medium text-white/75">MÔ SALO</p>
                  <p className="text-lg font-bold">Bem-vindo de volta</p>
                </div>
              </div>
              <p className="text-sm text-white/80">Acede à tua conta para continuar a procurar e candidatar-te.</p>
            </div>

            <div className="bg-white px-5 py-6 sm:px-7 lg:rounded-[28px] lg:border lg:border-ms-border lg:p-8">
              <div className="hidden lg:block mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ms-blue/10 text-ms-blue mb-4">
                  <Briefcase size={22} />
                </div>
                <h2 className="text-2xl font-bold text-ms-dark">Entrar na tua conta</h2>
                <p className="mt-2 text-sm text-ms-gray">Usa o teu email e senha para continuar.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    placeholder="O seu email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-2xl border border-ms-border bg-ms-surface px-4 py-3.5 text-sm text-ms-dark outline-none transition-colors placeholder:text-ms-gray focus:border-ms-blue focus:bg-white"
                    required
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="A sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-ms-border bg-ms-surface px-4 py-3.5 pr-12 text-sm text-ms-dark outline-none transition-colors placeholder:text-ms-gray focus:border-ms-blue focus:bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-ms-blue"
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-ms-blue px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'A entrar...' : 'Entrar'}
                </button>

                <div className="text-center">
                  <button type="button" className="text-sm font-medium text-ms-blue hover:underline">
                    Esqueceu a senha?
                  </button>
                </div>
              </form>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-ms-border" />
                <span className="text-xs font-medium uppercase tracking-wide text-ms-gray">ou</span>
                <div className="h-px flex-1 bg-ms-border" />
              </div>

              <button onClick={handleGoogleLogin} type="button" className="flex w-full items-center justify-center gap-3 rounded-2xl border border-ms-border bg-white px-4 py-3.5 text-sm font-semibold text-ms-dark transition-colors hover:bg-ms-surface">
                <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span>Continuar com Google</span>
              </button>

              <p className="mt-6 text-center text-sm text-ms-gray">
                Não tem conta?{' '}
                <Link href="/auth/registar/" className="font-semibold text-ms-blue hover:underline">
                  Registar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
