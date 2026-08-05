import Link from 'next/link'
import { Check, Zap, Crown, Building } from 'lucide-react'

const plans = [
  {
    name: 'Trial Gratuito',
    price: '0 Kz',
    period: '2 dias',
    icon: Zap,
    description: 'Experimenta a plataforma gratuitamente',
    features: [
      'Acesso limitado a vagas',
      'Perfil básico',
      'Visualização de vagas da tua área',
      'Suporte via email',
    ],
    cta: 'Começar Grátis',
    popular: false,
    color: 'bg-ms-surface border-ms-border',
  },
  {
    name: 'Candidato Premium',
    price: '1.000 Kz',
    period: '/mês',
    icon: Crown,
    description: 'Acesso completo para candidatos',
    features: [
      'IA para optimização do perfil',
      'Criação de CV com modelos ATS',
      'Vagas filtradas por área',
      'Acesso à comunidade',
      'Dicas personalizadas de carreira',
      'Candidatura com 1 clique',
      'Notificações de novas vagas',
    ],
    cta: 'Subscrever Agora',
    popular: true,
    color: 'bg-white border-ms-blue/30',
  },
  {
    name: 'Recrutador / Empresa',
    price: 'Sob consulta',
    period: '',
    icon: Building,
    description: 'Solução completa para empresas',
    features: [
      'Dashboard de recrutamento',
      'Candidatos filtrados automaticamente',
      'Analytics avançado',
      'Publicação ilimitada de vagas',
      'Comunicação directa com candidatos',
      'Exportação de dados CSV/PDF',
      'Vagas prioritárias disponíveis',
    ],
    cta: 'Contactar-nos',
    popular: false,
    color: 'bg-ms-surface border-ms-border',
  },
]

export default function Pricing() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-k10-primary mb-3">Planos e Preços</h2>
          <p className="text-ms-gray/70 max-w-md mx-auto">Preços acessíveis adaptados ao mercado angolano</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.name}
                className={`rounded-[32px] border-2 p-6 relative ${plan.color} ${plan.popular ? 'shadow-ios scale-[1.03]' : 'shadow-ios-sm'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-ms-blue text-white text-xs font-bold px-4 py-1.5 rounded-full">
                      Mais Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${plan.popular ? 'bg-ms-blue/10 text-ms-blue' : 'bg-ms-surface text-ms-gray'} flex items-center justify-center mx-auto mb-3`}>
                    <Icon size={24} />
                  </div>
                  <h3 className="font-heading font-bold text-lg mb-1">{plan.name}</h3>
                  <p className="text-ms-gray/70 text-sm mb-3">{plan.description}</p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-k10-primary">{plan.price}</span>
                    <span className="text-ms-gray/60 text-sm">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-ms-gray">
                      <Check size={16} className="text-ms-green mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/registar/"
                  className={`block text-center py-3.5 rounded-full font-semibold text-sm transition-all active:scale-[0.98] shadow-ios-sm ${
                    plan.popular
                      ? 'bg-ms-blue text-white hover:brightness-105'
                      : 'bg-ms-dark text-white hover:bg-ms-dark/90'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
