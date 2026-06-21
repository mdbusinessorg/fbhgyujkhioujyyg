'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Mail, Lock, User, Briefcase, Eye, EyeOff } from 'lucide-react'

export default function RegistarPage() {
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [role, setRole] = useState<'candidato' | 'recrutador'>('candidato')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      setError(authError.message === 'User already registered' ? 'Este email já está registado.' : authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      const now = new Date()
      const trialEnd = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)

      await supabase.from('users').insert({
        id: authData.user.id,
        email,
        nome,
        role,
        aprovado: role === 'candidato',
      })

      if (role === 'candidato') {
        await supabase.from('subscriptions').insert({
          user_id: authData.user.id,
          plano: 'trial',
          valor: 0,
          status: 'ativa',
          data_inicio: now.toISOString(),
          data_fim: trialEnd.toISOString(),
        })
      }

      if (role === 'recrutador') {
        window.location.href = '/dashboard/recrutador/'
      } else {
        window.location.href = '/dashboard/candidato/'
      }
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-indigo-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-white text-center max-w-md">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Briefcase size={32} className="text-white" />
          </div>
          <h2 className="font-heading text-3xl font-bold mb-4">MÔ SALO</h2>
          <p className="text-white/80 text-lg">Junta-te à maior comunidade de emprego em Angola.</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Briefcase size={20} className="text-white" />
            </div>
            <span className="font-heading font-bold text-xl">MÔ SALO</span>
          </div>

          <h1 className="font-heading text-2xl font-bold text-gray-900 mb-2">Criar Conta</h1>
          <p className="text-gray-500 text-sm mb-6">Começa a tua jornada profissional</p>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setRole('candidato')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                role === 'candidato'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <User size={16} className="inline mr-2" />
              Candidato
            </button>
            <button
              onClick={() => setRole('recrutador')}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                role === 'recrutador'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Briefcase size={16} className="inline mr-2" />
              Recrutador
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome Completo</label>
              <div className="relative">
                <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="input-field !pl-11"
                  placeholder="O teu nome"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field !pl-11"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field !pl-11 !pr-11"
                  placeholder="Mínimo 6 caracteres"
                  required
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">{error}</p>}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : 'Criar Conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tens conta?{' '}
            <Link href="/auth/login/" className="text-k10-accent hover:underline font-medium">Entrar</Link>
          </p>

          {role === 'candidato' && (
            <p className="text-center text-xs text-gray-400 mt-4 bg-indigo-50 p-3 rounded-xl">
              🎉 Inclui 2 dias de trial gratuito!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
