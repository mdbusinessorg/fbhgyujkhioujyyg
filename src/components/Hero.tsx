'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, MapPin, Briefcase, Users, TrendingUp, Building } from 'lucide-react'

export default function Hero() {
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <section className="gradient-hero min-h-[80vh] flex items-center relative overflow-hidden">
      <div className="absolute top-20 right-20 w-96 h-96 bg-k10-accent/5 rounded-full blur-3xl" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-emerald-100/50 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10 w-full">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-k10-accent/10 px-4 py-2 rounded-full mb-6">
            <span className="w-2 h-2 bg-k10-accent rounded-full animate-pulse" />
            <span className="text-k10-accent text-sm font-medium">Plataforma #1 de Emprego em Angola</span>
          </div>
          
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-k10-primary leading-tight mb-6">
            Encontra o Emprego
            <span className="relative inline-block mx-3">
              <span className="relative z-10 text-white px-4 py-1 bg-k10-accent rounded-lg">Ideal</span>
            </span>
            <br className="hidden sm:block" />
            na Tua Cidade
          </h1>
          
          <p className="text-gray-500 text-lg mb-10 max-w-2xl mx-auto">
            Conectamos talentos angolanos às melhores oportunidades. Pesquisa por cargo, empresa ou localização.
          </p>

          <div className="bg-white rounded-2xl shadow-xl p-3 max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cargo, empresa ou palavra-chave"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-k10-accent/20 outline-none text-sm"
              />
            </div>
            <div className="relative flex-1 hidden sm:block">
              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cidade ou província"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 border-0 focus:bg-white focus:ring-2 focus:ring-k10-accent/20 outline-none text-sm"
              />
            </div>
            <Link
              href={`/vagas/${searchTerm ? `?q=${encodeURIComponent(searchTerm)}` : ''}`}
              className="btn-primary !rounded-xl !py-3.5 !px-8 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <Search size={18} />
              Procurar
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mt-12">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-k10-accent/10 rounded-lg flex items-center justify-center">
                <Briefcase size={18} className="text-k10-accent" />
              </div>
              <div className="text-left">
                <div className="font-bold text-k10-primary">500+</div>
                <div className="text-gray-400 text-xs">Vagas Activas</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={18} className="text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-k10-primary">2.000+</div>
                <div className="text-gray-400 text-xs">Candidatos</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Building size={18} className="text-amber-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-k10-primary">150+</div>
                <div className="text-gray-400 text-xs">Empresas</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={18} className="text-emerald-600" />
              </div>
              <div className="text-left">
                <div className="font-bold text-k10-primary">95%</div>
                <div className="text-gray-400 text-xs">Taxa Sucesso</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
