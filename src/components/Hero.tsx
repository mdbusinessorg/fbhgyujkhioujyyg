'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Briefcase, User, Building2 } from 'lucide-react'

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <section className="gradient-hero min-h-[85vh] flex items-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-200 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-k10-primary leading-tight mb-4">
            Encontre o seu
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600"> emprego ideal</span>
          </h1>
          <p className="text-gray-600 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
            Milhares de vagas em Angola. Candidata-te com um clique.
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-3 sm:p-4 max-w-2xl mx-auto mb-10">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <Search size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Cargo ou palavra-chave"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                <MapPin size={20} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Luanda, Angola"
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
              <Link href="/vagas/" className="btn-primary flex items-center justify-center gap-2 !rounded-xl whitespace-nowrap">
                <Search size={16} />
                Pesquisar
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            <Link href="/auth/login/" className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:-translate-y-1 transition-all">
                <User size={24} className="text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-gray-600">Entrar</span>
            </Link>
            <Link href="/vagas/" className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:-translate-y-1 transition-all">
                <Briefcase size={24} className="text-purple-600" />
              </div>
              <span className="text-xs font-medium text-gray-600">Ver Vagas</span>
            </Link>
            <Link href="/auth/registar/" className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-md flex items-center justify-center group-hover:shadow-lg group-hover:-translate-y-1 transition-all">
                <Building2 size={24} className="text-indigo-600" />
              </div>
              <span className="text-xs font-medium text-gray-600">Recrutar</span>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-500 mb-4">Empresas que confiam em nós</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-60">
            <span className="font-heading font-bold text-xl text-gray-400">SONANGOL</span>
            <span className="font-heading font-bold text-xl text-gray-400">UNITEL</span>
            <span className="font-heading font-bold text-xl text-gray-400">BAI</span>
            <span className="font-heading font-bold text-xl text-gray-400">ENDIAMA</span>
            <span className="font-heading font-bold text-xl text-gray-400">TAAG</span>
          </div>
        </div>
      </div>
    </section>
  )
}
