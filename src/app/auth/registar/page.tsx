'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Mail, Lock, User, Eye, EyeOff, UserPlus, Briefcase, Users } from 'lucide-react'

type Role = 'candidato' | 'recrutador'

export default function RegistarPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Role>('candidato')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      setLoading(false)
      return
    }

    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome, role },
        },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Este email já está registado. Tenta fazer login.'
          : 'Erro ao criar conta. Tenta novamente.')
        setLoading(false)
        return
      }

      if (authData.user) {
        await supabase.from('users').insert({
          id: authData.user.id,
          email,
          nome,
          role,
          aprovado: role === 'candidato',
        })

        await supabase.from('profiles').insert({
          user_id: authData.user.id,
          area: '',
          nivel_academico: '',
          experiencias: '',
          competencias: [],
          score_completude: 0,
        })

        if (role === 'candidato') {
          await supabase.from('subscriptions').insert({
            user_id: authData.user.id,
            plano: 'trial',
            valor: 0,
            status: 'ativa',
            data_inicio: new Date().toISOString(),
            data_fim: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          })
        }
      }

      setSuccess(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        setError('Erro de rede. Verifica a tua ligação à internet e tenta novamente.')
      } else {
        setError('Erro ao criar conta: ' + message)
      }
      setLoading(false)
    }
  }

  if (success) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserPlus size={28} className="text-green-600" />
              </div>
              <h2 className="font-heading text-xl font-bold text-k10-primary mb-2">
                Conta Criada com Sucesso!
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                {role === 'recrutador'
                  ? 'A tua conta de recrutador foi criada e está pendente de aprovação pelo administrador. Receberás uma notificação quando for aprovada.'
                  : 'A tua conta foi criada! Tens 2 dias de trial gratuito. Verifica o teu email para confirmar a conta.'}
              </p>
              <Link href="/auth/login/" className="btn-primary inline-flex items-center gap-2">
                Ir para Login
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-6">
              <Image src="/k10-logo.png" alt="K10" width={56} height={56} className="rounded-xl mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold text-k10-primary">Criar Conta</h1>
              <p className="text-gray-500 text-sm mt-1">Junta-te ao K10 Opportunities</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setRole('candidato')}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  role === 'candidato'
                    ? 'border-k10-accent bg-k10-accent/5 text-k10-accent'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Users size={22} className="mx-auto mb-1" />
                <span className="text-sm font-medium">Candidato</span>
              </button>
              <button
                type="button"
                onClick={() => setRole('recrutador')}
                className={`p-3 rounded-xl border-2 text-center transition-all ${
                  role === 'recrutador'
                    ? 'border-k10-accent bg-k10-accent/5 text-k10-accent'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                <Briefcase size={22} className="mx-auto mb-1" />
                <span className="text-sm font-medium">Recrutador</span>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">{error}</div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {role === 'recrutador' ? 'Nome da Empresa' : 'Nome Completo'}
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="input-field pl-10"
                    placeholder={role === 'recrutador' ? 'Nome da empresa' : 'O teu nome completo'}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-10"
                    placeholder="teu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pl-10 pr-10"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {role === 'recrutador' && (
                <div className="bg-yellow-50 text-yellow-700 text-xs p-3 rounded-xl">
                  Nota: Contas de recrutador requerem aprovação do administrador antes de poderem publicar vagas.
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <UserPlus size={18} />
                    Criar Conta
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Já tens conta?{' '}
              <Link href="/auth/login/" className="text-k10-accent hover:underline font-medium">
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
