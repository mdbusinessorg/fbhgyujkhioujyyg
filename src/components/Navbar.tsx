'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Menu, X, User, LogIn, Briefcase, Search, BookOpen, LogOut, LayoutDashboard } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface UserData {
  role: string
  nome: string
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('role, nome')
            .eq('email', session.user.email)
            .single()
          if (userData) {
            setUser(userData)
          } else {
            setUser({ role: 'candidato', nome: session.user.email || '' })
          }
        }
      } catch {
        // silently fail
      }
      setLoading(false)
    }
    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role, nome')
          .eq('email', session.user.email)
          .single()
        if (userData) {
          setUser(userData)
        } else {
          setUser({ role: 'candidato', nome: session.user.email || '' })
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const getDashboardLink = () => {
    if (!user) return '/dashboard/candidato/'
    if (user.role === 'admin') return '/dashboard/admin/'
    if (user.role === 'recrutador') return '/dashboard/recrutador/'
    return '/dashboard/candidato/'
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <Briefcase size={18} className="text-white" />
            </div>
            <span className="font-heading font-bold text-lg text-k10-primary hidden sm:block">
              MÔ <span className="text-k10-accent">SALO</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/vagas/" className="flex items-center gap-1.5 text-gray-600 hover:text-k10-accent transition-colors font-medium text-sm">
              <Briefcase size={16} />
              Vagas
            </Link>
            <Link href="/guia/" className="flex items-center gap-1.5 text-gray-600 hover:text-k10-accent transition-colors font-medium text-sm">
              <BookOpen size={16} />
              Guia
            </Link>
            <Link href="/vagas/" className="flex items-center gap-1.5 text-gray-600 hover:text-k10-accent transition-colors font-medium text-sm">
              <Search size={16} />
              Pesquisar
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-20 h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <Link href={getDashboardLink()} className="flex items-center gap-2 text-gray-600 hover:text-k10-accent transition-colors">
                  <LayoutDashboard size={16} />
                  <span className="text-sm font-medium">Painel</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors text-sm"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            ) : (
              <>
                <Link href="/auth/login/" className="flex items-center gap-1.5 text-gray-600 hover:text-k10-accent transition-colors font-medium text-sm">
                  <LogIn size={16} />
                  Entrar
                </Link>
                <Link href="/auth/registar/" className="btn-primary text-sm !py-2 !px-4">
                  Criar Conta
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden text-gray-600 hover:text-k10-accent">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-4 space-y-3">
            <Link href="/vagas/" className="flex items-center gap-2 py-2 text-gray-600 hover:text-k10-accent" onClick={() => setIsOpen(false)}>
              <Briefcase size={18} />
              Vagas
            </Link>
            <Link href="/guia/" className="flex items-center gap-2 py-2 text-gray-600 hover:text-k10-accent" onClick={() => setIsOpen(false)}>
              <BookOpen size={18} />
              Guia
            </Link>
            <Link href="/vagas/" className="flex items-center gap-2 py-2 text-gray-600 hover:text-k10-accent" onClick={() => setIsOpen(false)}>
              <Search size={18} />
              Pesquisar
            </Link>
            <hr className="border-gray-100" />
            {user ? (
              <>
                <Link href={getDashboardLink()} className="flex items-center gap-2 py-2 text-gray-600 hover:text-k10-accent" onClick={() => setIsOpen(false)}>
                  <LayoutDashboard size={18} />
                  Painel
                </Link>
                <button
                  onClick={() => { handleLogout(); setIsOpen(false) }}
                  className="flex items-center gap-2 py-2 text-red-500 w-full"
                >
                  <LogOut size={18} />
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login/" className="flex items-center gap-2 py-2 text-gray-600 hover:text-k10-accent" onClick={() => setIsOpen(false)}>
                  <LogIn size={18} />
                  Entrar
                </Link>
                <Link href="/auth/registar/" className="btn-primary text-center block text-sm" onClick={() => setIsOpen(false)}>
                  Criar Conta
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
