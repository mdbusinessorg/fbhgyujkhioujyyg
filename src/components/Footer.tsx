import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'
import Logo from '@/components/Logo'

export default function Footer() {
  return (
    <footer className="bg-ms-dark text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <Logo className="mb-4" iconClassName="h-9 w-9" textClassName="text-white" />
            <p className="text-gray-400 text-sm leading-relaxed">
              Plataforma de recrutamento angolana. Conectamos talentos às melhores oportunidades.
            </p>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Plataforma</h3>
            <div className="space-y-2">
              <Link href="/vagas/" className="block text-gray-400 hover:text-white text-sm transition-colors">Vagas</Link>
              <Link href="/guia/" className="block text-gray-400 hover:text-white text-sm transition-colors">Guia do Candidato</Link>
              <Link href="/auth/registar/" className="block text-gray-400 hover:text-white text-sm transition-colors">Criar Conta</Link>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Para Empresas</h3>
            <div className="space-y-2">
              <Link href="/auth/registar/" className="block text-gray-400 hover:text-white text-sm transition-colors">Publicar Vagas</Link>
              <Link href="/auth/registar/" className="block text-gray-400 hover:text-white text-sm transition-colors">Área do Recrutador</Link>
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold mb-4 text-sm uppercase tracking-wider">Contacto</h3>
            <div className="space-y-2 text-sm text-gray-400">
              <p className="flex items-center gap-2"><Mail size={14} /> matiasdomingos70@gmail.com</p>
              <p className="flex items-center gap-2"><Phone size={14} /> +244 926 115 429</p>
              <p className="flex items-center gap-2"><MapPin size={14} /> Luanda, Angola</p>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center">
          <p className="text-gray-500 text-xs">&copy; 2024 MÔ SALO. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
