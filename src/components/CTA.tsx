import Link from 'next/link'
import { Briefcase, ArrowRight } from 'lucide-react'

export default function CTA() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 rounded-3xl p-8 sm:p-12 text-center text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 right-10 w-60 h-60 bg-indigo-300 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Briefcase size={28} className="text-white" />
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold mb-4">
              Pronto para começar?
            </h2>
            <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
              Junta-te a milhares de profissionais angolanos que já encontraram a sua oportunidade ideal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/registar/" className="bg-white text-indigo-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-100 transition-all inline-flex items-center justify-center gap-2">
                Criar Conta Grátis
                <ArrowRight size={18} />
              </Link>
              <Link href="/vagas/" className="border-2 border-white/40 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/10 transition-all inline-flex items-center justify-center gap-2">
                <Briefcase size={18} />
                Explorar Vagas
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
