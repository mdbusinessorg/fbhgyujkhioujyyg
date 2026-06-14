'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { supabase } = await import('@/lib/supabase')
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Email ou senha incorretos. Tenta novamente.')
        setLoading(false)
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role, aprovado')
        .eq('email', email)
        .single()

      if (userData) {
        if (userData.role === 'admin') {
          window.location.href = '/dashboard/admin/'
        } else if (userData.role === 'recrutador') {
          if (!userData.aprovado) {
            setError('A tua conta de recrutador ainda está pendente de aprovação pelo administrador.')
            setLoading(false)
            return
          }
          window.location.href = '/dashboard/recrutador/'
        } else {
          window.location.href = '/dashboard/candidato/'
        }
      }
    } catch {
      setError('Erro ao conectar. Verifica a tua ligação à internet.')
      setLoading(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <Image src="/k10-logo.png" alt="K10" width={56} height={56} className="rounded-xl mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold text-k10-primary">Bem-vindo de volta</h1>
              <p className="text-gray-500 text-sm mt-1">Entra na tua conta K10 Opportunities</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
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
                    placeholder="A tua senha"
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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Entrar
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Não tens conta?{' '}
              <Link href="/auth/registar/" className="text-k10-accent hover:underline font-medium">
                Criar conta grátis
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
