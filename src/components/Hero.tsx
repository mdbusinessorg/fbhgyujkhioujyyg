'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Briefcase, User, Building2 } from 'lucide-react'

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <section className="gradient-hero min-h-[88vh] flex items-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-24 left-12 w-80 h-80 bg-ms-blue/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-24 right-12 w-[28rem] h-[28rem] bg-ms-purple/20 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10 w-full">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-k10-primary leading-[1.1] mb-5 tracking-tight">
            Encontre o seu
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-ms-blue to-ms-purple"> emprego ideal</span>
          </h1>
          <p className="text-ms-gray text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Milhares de vagas em Angola. Candidata-te com um clique.
          </p>

          <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] shadow-ios p-3 sm:p-4 max-w-2xl mx-auto mb-10 border border-white/50">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 bg-ms-surface rounded-2xl px-4 py-3.5">
                <Search size={20} className="text-ms-gray/50" />
                <input
                  type="text"
                  placeholder="Cargo ou palavra-chave"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
              <div className="flex-1 flex items-center gap-2 bg-ms-surface rounded-2xl px-4 py-3.5">
                <MapPin size={20} className="text-ms-gray/50" />
                <input
                  type="text"
                  placeholder="Luanda, Angola"
                  className="w-full bg-transparent outline-none text-sm"
                />
              </div>
              <Link href="/vagas/" className="btn-primary flex items-center justify-center gap-2 !rounded-2xl whitespace-nowrap">
                <Search size={16} />
                Pesquisar
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 sm:gap-10">
            <Link href="/auth/login/" className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-white rounded-[26px] shadow-ios-sm flex items-center justify-center group-hover:shadow-ios group-hover:-translate-y-1 transition-all">
                <User size={24} className="text-ms-blue" />
              </div>
              <span className="text-xs font-medium text-ms-gray">Entrar</span>
            </Link>
            <Link href="/vagas/" className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-white rounded-[26px] shadow-ios-sm flex items-center justify-center group-hover:shadow-ios group-hover:-translate-y-1 transition-all">
                <Briefcase size={24} className="text-ms-purple" />
              </div>
              <span className="text-xs font-medium text-ms-gray">Ver Vagas</span>
            </Link>
            <Link href="/auth/registar/" className="flex flex-col items-center gap-2 group">
              <div className="w-16 h-16 bg-white rounded-[26px] shadow-ios-sm flex items-center justify-center group-hover:shadow-ios group-hover:-translate-y-1 transition-all">
                <Building2 size={24} className="text-ms-blue" />
              </div>
              <span className="text-xs font-medium text-ms-gray">Recrutar</span>
            </Link>
          </div>
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-ms-gray/70 mb-5 font-medium">Empresas que confiam em nós</p>
          <div className="flex flex-wrap justify-center gap-8 opacity-50">
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
