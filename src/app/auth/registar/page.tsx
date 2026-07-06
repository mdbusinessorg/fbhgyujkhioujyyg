'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Briefcase } from 'lucide-react'
import AuthIllustration from '@/components/AuthIllustration'

export default function RegisterPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [role, setRole] = useState<'candidato' | 'recrutador'>('candidato')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const userId = data.user?.id
    if (userId) {
      await supabase.from('users').insert({
        id: userId,
        email,
        nome,
        role,
        aprovado: role === 'candidato',
      })

      if (role === 'candidato') {
        await supabase.from('subscriptions').insert({
          user_id: userId,
          plano: 'trial',
          status: 'ativa',
          data_inicio: new Date().toISOString(),
          data_fim: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        })
      }
    }

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
            Cria a tua conta e começa a candidatar-te
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/80 sm:text-base">
            Junta-te ao MÔ SALO para guardar vagas, acompanhar candidaturas e destacar o teu perfil.
          </p>
          <div className="mx-auto mt-8 flex justify-center">
            <AuthIllustration />
          </div>
          <div className="mx-auto mt-6 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90">
            Um perfil, mais oportunidades
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
                  <p className="text-lg font-bold">Criar conta</p>
                </div>
              </div>
              <p className="text-sm text-white/80">Preenche os teus dados e escolhe o tipo de conta para continuar.</p>
            </div>

            <div className="bg-white px-5 py-6 sm:px-7 lg:rounded-[28px] lg:border lg:border-ms-border lg:p-8">
              <div className="hidden lg:block mb-8">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ms-blue/10 text-ms-blue mb-4">
                  <Briefcase size={22} />
                </div>
                <h2 className="text-2xl font-bold text-ms-dark">Criar conta</h2>
                <p className="mt-2 text-sm text-ms-gray">Escolhe o teu perfil e começa já.</p>
              </div>

              <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-ms-surface p-1">
                <button
                  type="button"
                  onClick={() => setRole('candidato')}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                    role === 'candidato'
                      ? 'bg-white text-ms-blue shadow-sm'
                      : 'text-ms-gray'
                  }`}
                >
                  Candidato
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recrutador')}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                    role === 'recrutador'
                      ? 'bg-white text-ms-blue shadow-sm'
                      : 'text-ms-gray'
                  }`}
                >
                  Recrutador
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Nome completo"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full rounded-2xl border border-ms-border bg-ms-surface px-4 py-3.5 text-sm text-ms-dark outline-none transition-colors placeholder:text-ms-gray focus:border-ms-blue focus:bg-white"
                  required
                />

                <input
                  type="email"
                  placeholder="O seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-ms-border bg-ms-surface px-4 py-3.5 text-sm text-ms-dark outline-none transition-colors placeholder:text-ms-gray focus:border-ms-blue focus:bg-white"
                  required
                />

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha"
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

                <input
                  type="password"
                  placeholder="Confirmar senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-2xl border border-ms-border bg-ms-surface px-4 py-3.5 text-sm text-ms-dark outline-none transition-colors placeholder:text-ms-gray focus:border-ms-blue focus:bg-white"
                  required
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-ms-blue px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'A criar...' : 'Criar conta'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-ms-gray">
                Já tem conta?{' '}
                <Link href="/auth/login/" className="font-semibold text-ms-blue hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
