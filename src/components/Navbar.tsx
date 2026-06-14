'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, User, LogIn, Briefcase, Search, Shield, BookOpen } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/k10-logo.png" alt="K10 Opportunities" width={40} height={40} className="rounded-lg" />
            <span className="font-heading font-bold text-xl text-k10-primary">
              K<span className="text-k10-accent">10</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/vagas/" className="flex items-center gap-1.5 text-gray-600 hover:text-k10-accent transition-colors font-medium text-sm">
              <Briefcase size={16} />
              Vagas
            </Link>
            <Link href="/guia/" className="flex items-center gap-1.5 text-gray-600 hover:text-k10-accent transition-colors font-medium text-sm">
              <BookOpen size={16} />
              Guia do Candidato
            </Link>
            <Link href="/vagas/" className="flex items-center gap-1.5 text-gray-600 hover:text-k10-accent transition-colors font-medium text-sm">
              <Search size={16} />
              Pesquisar
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/dashboard/candidato/" className="flex items-center gap-2 text-gray-600 hover:text-k10-accent transition-colors">
                <User size={18} />
                <span className="text-sm font-medium">Meu Painel</span>
              </Link>
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
              Guia do Candidato
            </Link>
            <Link href="/vagas/" className="flex items-center gap-2 py-2 text-gray-600 hover:text-k10-accent" onClick={() => setIsOpen(false)}>
              <Search size={18} />
              Pesquisar
            </Link>
            <hr className="border-gray-100" />
            <Link href="/auth/login/" className="flex items-center gap-2 py-2 text-gray-600 hover:text-k10-accent" onClick={() => setIsOpen(false)}>
              <LogIn size={18} />
              Entrar
            </Link>
            <Link href="/auth/registar/" className="btn-primary text-center block text-sm" onClick={() => setIsOpen(false)}>
              Criar Conta
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
