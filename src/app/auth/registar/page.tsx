'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Briefcase } from 'lucide-react'

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
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-10 h-10 bg-ms-blue rounded-xl flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
          </div>
          <h1 className="text-[28px] font-bold text-ms-blue">Criar conta</h1>
          <p className="text-sm text-ms-gray mt-1">Junte-se ao MÔ SALO</p>
        </div>

        {/* Role selector */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setRole('candidato')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              role === 'candidato'
                ? 'bg-ms-blue text-white'
                : 'bg-ms-surface text-ms-gray border border-ms-border'
            }`}
          >
            Candidato
          </button>
          <button
            type="button"
            onClick={() => setRole('recrutador')}
            className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
              role === 'recrutador'
                ? 'bg-ms-blue text-white'
                : 'bg-ms-surface text-ms-gray border border-ms-border'
            }`}
          >
            Recrutador
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <input
            type="text"
            placeholder="Nome completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            className="input-field"
            required
          />

          <input
            type="email"
            placeholder="O seu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Senha"
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

          <input
            type="password"
            placeholder="Confirmar senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-field"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ms-blue text-white font-semibold py-3.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'A criar...' : 'Criar conta'}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-ms-gray mt-6">
          Já tem conta?{' '}
          <Link href="/auth/login/" className="text-ms-blue font-semibold hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
