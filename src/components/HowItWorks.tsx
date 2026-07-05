import { UserPlus, Search, Send, CheckCircle } from 'lucide-react'

const steps = [
  { icon: UserPlus, title: 'Cria a tua conta', desc: 'Regista-te gratuitamente em segundos' },
  { icon: Search, title: 'Pesquisa vagas', desc: 'Explora vagas filtradas por área' },
  { icon: Send, title: 'Candidata-te', desc: 'Envia candidatura com um clique' },
  { icon: CheckCircle, title: 'Recebe resposta', desc: 'O recrutador responde directamente' },
]

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-k10-primary mb-3">Como Funciona</h2>
          <p className="text-gray-500 max-w-lg mx-auto">4 passos simples para encontrares o emprego ideal</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Icon size={28} className="text-indigo-600" />
                </div>
                <span className="inline-flex items-center justify-center w-6 h-6 bg-indigo-600 text-white text-xs font-bold rounded-full mb-2">{i + 1}</span>
                <h3 className="font-heading font-semibold text-gray-900 text-sm mb-1">{step.title}</h3>
                <p className="text-xs text-gray-500">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
