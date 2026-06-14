import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'K10 Opportunities — Recrutamento Inteligente em Angola',
  description: 'Plataforma de recrutamento inteligente angolana. Conectamos talentos às melhores oportunidades com IA, vagas filtradas e comunidade profissional.',
  keywords: 'emprego angola, vagas angola, recrutamento luanda, trabalho angola, K10 opportunities',
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
