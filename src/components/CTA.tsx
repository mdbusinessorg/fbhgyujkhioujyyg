import Link from 'next/link'
import { ArrowRight, Users, Briefcase } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-k10-accent rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-48 h-48 bg-emerald-300 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para a tua próxima oportunidade?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Junta-te a milhares de profissionais angolanos que já encontraram o emprego ideal através do K10.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/registar/" className="bg-white text-k10-accent hover:bg-gray-100 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg">
                <Users size={18} />
                Sou Candidato
                <ArrowRight size={16} />
              </Link>
              <Link href="/auth/registar/" className="bg-white/10 backdrop-blur-sm text-white border border-white/30 hover:bg-white/20 font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
                <Briefcase size={18} />
                Sou Recrutador
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
