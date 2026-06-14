import { UserPlus, FileText, Send, CheckCircle } from 'lucide-react'

const steps = [
  {
    icon: UserPlus,
    title: 'Cria a tua Conta',
    description: 'Regista-te como candidato ou recrutador. Terás 2 dias de trial gratuito.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    icon: FileText,
    title: 'Completa o Perfil',
    description: 'Preenche o teu perfil com ajuda da IA. Quanto mais completo, mais visível serás.',
    color: 'bg-green-50 text-green-600',
  },
  {
    icon: Send,
    title: 'Candidata-te',
    description: 'Vê apenas vagas da tua área e candidata-te com um clique.',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    icon: CheckCircle,
    title: 'Conquista a Vaga',
    description: 'Acompanha o status da candidatura e comunica com recrutadores.',
    color: 'bg-k10-accent/10 text-k10-accent',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-k10-primary mb-3">Como Funciona</h2>
          <p className="text-gray-500 max-w-md mx-auto">Em 4 passos simples encontras a tua próxima oportunidade</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="text-center relative">
                {idx < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gray-200" />
                )}
                <div className={`w-16 h-16 rounded-2xl ${step.color} flex items-center justify-center mx-auto mb-4 relative z-10`}>
                  <Icon size={28} />
                </div>
                <div className="text-xs font-bold text-k10-accent mb-2">PASSO {idx + 1}</div>
                <h3 className="font-heading font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
