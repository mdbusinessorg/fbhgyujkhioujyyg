import { UserPlus, FileText, Search, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Cria a tua Conta',
    description: 'Regista-te como candidato ou recrutador em menos de 1 minuto.',
    color: 'bg-k10-accent/10 text-k10-accent',
  },
  {
    icon: FileText,
    title: 'Carrega o CV',
    description: 'Envia o teu CV e documentos para os recrutadores poderem avaliar.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: Search,
    title: 'Explora Vagas',
    description: 'Pesquisa vagas filtradas por área, localização e nível académico.',
    color: 'bg-amber-50 text-amber-600',
  },
  {
    icon: CheckCircle,
    title: 'Candidata-te',
    description: 'Envia a candidatura com um clique e acompanha o status em tempo real.',
    color: 'bg-emerald-50 text-emerald-600',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-20 bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-k10-primary mb-3">Como Funciona</h2>
          <p className="text-gray-500 max-w-md mx-auto">Em 4 passos simples encontras a tua próxima oportunidade</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="text-center relative group">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-gray-200 group-hover:bg-k10-accent/30 transition-colors" />
                )}
                <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-5 relative z-10 group-hover:scale-110 transition-transform`}>
                  <Icon size={32} />
                </div>
                <div className="text-xs font-bold text-k10-accent mb-2 uppercase tracking-wider">Passo {idx + 1}</div>
                <h3 className="font-heading font-semibold text-lg mb-2 text-k10-primary">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
