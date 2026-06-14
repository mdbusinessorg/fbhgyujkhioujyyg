import Link from 'next/link'
import Image from 'next/image'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-k10-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <Image src="/k10-logo.png" alt="K10" width={36} height={36} className="rounded-lg" />
              <span className="font-heading font-bold text-lg">
                K<span className="text-k10-accent">10</span> Opportunities
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              A plataforma de recrutamento inteligente de Angola. Conectamos talentos às melhores oportunidades.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-k10-accent">Plataforma</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/vagas/" className="hover:text-white transition-colors">Vagas</Link></li>
              <li><Link href="/guia/" className="hover:text-white transition-colors">Guia do Candidato</Link></li>
              <li><Link href="/auth/registar/" className="hover:text-white transition-colors">Criar Conta</Link></li>
              <li><Link href="/auth/login/" className="hover:text-white transition-colors">Entrar</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-k10-accent">Para Empresas</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/auth/registar/" className="hover:text-white transition-colors">Publicar Vagas</Link></li>
              <li><Link href="/auth/registar/" className="hover:text-white transition-colors">Dashboard de Recrutamento</Link></li>
              <li><Link href="/auth/registar/" className="hover:text-white transition-colors">Vagas Prioritárias</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-sm uppercase tracking-wider mb-4 text-k10-accent">Contactos</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-k10-accent" />
                +244 934 859 240
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-k10-accent" />
                matiasdomingos158@gmail.com
              </li>
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-k10-accent" />
                Luanda, Angola
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} K10 Opportunities. Todos os direitos reservados.
          </p>
          <p className="text-gray-500 text-xs">
            Feito com dedicação em Angola
          </p>
        </div>
      </div>
    </footer>
  )
}
