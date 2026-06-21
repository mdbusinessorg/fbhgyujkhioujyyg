import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MÔ SALO — Encontre o Seu Emprego Ideal em Angola',
  description: 'Plataforma de recrutamento inteligente angolana. Conectamos talentos às melhores oportunidades com vagas filtradas e comunidade profissional.',
  keywords: 'emprego angola, vagas angola, recrutamento luanda, trabalho angola, mô salo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-AO">
      <body>{children}</body>
    </html>
  )
}
