import Link from 'next/link'
import { Search, Briefcase, Users, TrendingUp } from 'lucide-react'

export default function Hero() {
  return (
    <section className="gradient-hero min-h-[85vh] flex items-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-k10-accent rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-k10-gold rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <span className="w-2 h-2 bg-k10-green rounded-full animate-pulse" />
              <span className="text-gray-300 text-sm">Plataforma de Recrutamento Angolana</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
              Encontra a tua <br />
              <span className="text-transparent bg-clip-text gradient-accent bg-gradient-to-r from-k10-accent to-k10-gold">
                oportunidade ideal
              </span>
            </h1>
            
            <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-lg">
              Conectamos os melhores talentos angolanos às empresas que mais precisam. 
              Vagas filtradas pela tua área, perfil com IA e comunidade profissional.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link href="/auth/registar/" className="btn-primary text-center flex items-center justify-center gap-2">
                <Search size={18} />
                Começar Agora
              </Link>
              <Link href="/vagas/" className="btn-outline !border-white/30 !text-white hover:!bg-white/10 text-center flex items-center justify-center gap-2">
                <Briefcase size={18} />
                Ver Vagas
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-gray-400 text-xs">Vagas Activas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">2.000+</div>
                <div className="text-gray-400 text-xs">Candidatos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">150+</div>
                <div className="text-gray-400 text-xs">Empresas</div>
              </div>
            </div>
          </div>

          <div className="hidden lg:grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="card p-5 bg-white/10 backdrop-blur-sm border-white/10 text-white">
                <Briefcase className="text-k10-accent mb-3" size={28} />
                <h3 className="font-semibold mb-1">Vagas Filtradas</h3>
                <p className="text-gray-300 text-sm">Só vês vagas da tua área de formação</p>
              </div>
              <div className="card p-5 bg-white/10 backdrop-blur-sm border-white/10 text-white">
                <TrendingUp className="text-k10-green mb-3" size={28} />
                <h3 className="font-semibold mb-1">IA no Perfil</h3>
                <p className="text-gray-300 text-sm">Dicas inteligentes para destacar o teu perfil</p>
              </div>
            </div>
            <div className="space-y-4 mt-8">
              <div className="card p-5 bg-white/10 backdrop-blur-sm border-white/10 text-white">
                <Users className="text-k10-gold mb-3" size={28} />
                <h3 className="font-semibold mb-1">Comunidade</h3>
                <p className="text-gray-300 text-sm">Grupos por área profissional</p>
              </div>
              <div className="card p-5 bg-white/10 backdrop-blur-sm border-white/10 text-white">
                <Search className="text-blue-400 mb-3" size={28} />
                <h3 className="font-semibold mb-1">CV Profissional</h3>
                <p className="text-gray-300 text-sm">Modelos ATS prontos a usar</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
