import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { FileText, CheckCircle, AlertCircle, BookOpen, Award, Download, Lightbulb, Phone, Mail, Building2 } from 'lucide-react'

const documentos = [
  {
    nome: 'Bilhete de Identidade (BI)',
    descricao: 'Documento de identificação obrigatório. Deve estar dentro da validade.',
    onde: 'Emitido nos Serviços de Identificação Civil e Criminal (SIC) da tua província.',
    dica: 'Tira uma cópia digitalizada em boa qualidade. Muitas empresas pedem cópia colorida.',
  },
  {
    nome: 'Curriculum Vitae (CV)',
    descricao: 'Documento que resume a tua formação, experiência e competências profissionais.',
    onde: 'Podes criar o teu CV directamente na plataforma K10 usando os nossos modelos ATS.',
    dica: 'Usa um modelo ATS (Applicant Tracking System) para garantir que o teu CV passa nos sistemas automáticos de triagem.',
  },
  {
    nome: 'Diploma ou Certificado Académico',
    descricao: 'Prova da tua formação académica. Licenciatura, Mestrado, Técnico, etc.',
    onde: 'Solicita na secretaria da tua universidade ou instituto. O diploma definitivo pode demorar — pede a declaração de conclusão entretanto.',
    dica: 'Guarda sempre o original em segurança e usa cópias autenticadas para candidaturas.',
  },
  {
    nome: 'Carta de Motivação',
    descricao: 'Texto personalizado que explica por que és o candidato ideal para a vaga.',
    onde: 'Redijes tu mesmo, adaptando para cada vaga específica.',
    dica: 'Sê específico sobre a empresa e a vaga. Evita textos genéricos copiados da internet.',
  },
  {
    nome: 'Certificado de Registo Criminal',
    descricao: 'Documento que comprova que não tens antecedentes criminais.',
    onde: 'Solicita nos Serviços de Identificação Civil e Criminal (SIC) ou online no portal do SIC.',
    dica: 'Tem validade de 90 dias. Solicita apenas quando uma empresa pedir especificamente.',
  },
  {
    nome: 'Certificados de Formação Complementar',
    descricao: 'Cursos, workshops, formações e certificações profissionais.',
    onde: 'Emitidos pelas instituições onde realizaste as formações. Plataformas online como Coursera, Udemy também emitem certificados.',
    dica: 'Prioriza certificações reconhecidas na tua área. Qualidade importa mais que quantidade.',
  },
  {
    nome: 'Cartas de Recomendação',
    descricao: 'Referências de empregadores ou professores anteriores.',
    onde: 'Pede a ex-supervisores, professores ou colegas sénior que te conheçam profissionalmente.',
    dica: 'Duas cartas são suficientes. Avisa a pessoa antes de a colocar como referência.',
  },
  {
    nome: 'NIF (Número de Identificação Fiscal)',
    descricao: 'Necessário para fins contratuais e fiscais após ser contratado.',
    onde: 'Obtém na AGT (Administração Geral Tributária) da tua área de residência.',
    dica: 'Algumas empresas pedem o NIF logo na candidatura. Trata antecipadamente.',
  },
]

const dicasEntrevista = [
  'Pesquisa sobre a empresa antes da entrevista — conhece os produtos, serviços e valores.',
  'Chega 10-15 minutos antes do horário marcado.',
  'Veste-te de forma profissional e adequada ao sector.',
  'Prepara respostas para perguntas comuns: "Fala sobre ti", "Porquê esta empresa?", "Quais são os teus pontos fortes?".',
  'Traz cópias impressas do CV, diploma e BI.',
  'Mantém contacto visual e postura confiante.',
  'Faz perguntas sobre a função e a equipa — mostra interesse genuíno.',
  'Desliga o telemóvel ou coloca em silêncio.',
  'Após a entrevista, envia um email de agradecimento ao recrutador.',
]

export default function GuiaPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-gray-50">
        <div className="gradient-hero py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
              <BookOpen size={16} className="text-k10-gold" />
              <span className="text-gray-300 text-sm">Guia Completo</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-white mb-3">
              Guia do Candidato Angolano
            </h1>
            <p className="text-gray-300 max-w-lg mx-auto">
              Tudo o que precisas saber para te candidatares com sucesso. Documentos, dicas e orientações práticas.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

          <section>
            <div className="flex items-center gap-2 mb-6">
              <FileText size={24} className="text-k10-accent" />
              <h2 className="font-heading text-2xl font-bold text-k10-primary">Documentos Necessários</h2>
            </div>
            <p className="text-gray-500 mb-6">
              Antes de te candidatares, prepara estes documentos. Ter tudo organizado aumenta as tuas chances.
            </p>
            <div className="space-y-4">
              {documentos.map((doc) => (
                <div key={doc.nome} className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <CheckCircle size={18} className="text-k10-green" />
                    {doc.nome}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">{doc.descricao}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Onde obter</span>
                      <p className="text-blue-800 text-sm mt-1">{doc.onde}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider flex items-center gap-1">
                        <Lightbulb size={12} />
                        Dica
                      </span>
                      <p className="text-amber-800 text-sm mt-1">{doc.dica}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <Award size={24} className="text-k10-gold" />
              <h2 className="font-heading text-2xl font-bold text-k10-primary">Dicas para a Entrevista</h2>
            </div>
            <div className="card p-6">
              <ol className="space-y-3">
                {dicasEntrevista.map((dica, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 text-sm">
                    <span className="w-6 h-6 bg-k10-accent/10 text-k10-accent rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    {dica}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <Download size={24} className="text-k10-blue" />
              <h2 className="font-heading text-2xl font-bold text-k10-primary">CV com Modelos ATS</h2>
            </div>
            <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
              <h3 className="font-semibold text-blue-900 mb-2">O que é um CV modelo ATS?</h3>
              <p className="text-blue-800 text-sm mb-4">
                ATS (Applicant Tracking System) é um sistema usado por muitas empresas para filtrar CVs automaticamente.
                Um CV com formato ATS tem layout simples, sem tabelas complexas nem gráficos, garantindo que as tuas informações
                são lidas correctamente pelo sistema.
              </p>
              <div className="bg-white/60 rounded-xl p-4 mb-4">
                <h4 className="font-medium text-sm text-blue-900 mb-2">Regras de ouro para um CV ATS:</h4>
                <ul className="space-y-1 text-blue-700 text-sm">
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Layout limpo e simples, sem colunas múltiplas</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Usa secções claras: Dados Pessoais, Formação, Experiência, Competências</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Inclui palavras-chave da descrição da vaga</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Exporta em PDF (nunca Word ou imagem)</li>
                  <li className="flex items-center gap-2"><CheckCircle size={14} className="text-k10-green" /> Máximo 2 páginas para candidatos com experiência</li>
                </ul>
              </div>
              <Link href="/auth/registar/" className="btn-primary inline-flex items-center gap-2 text-sm">
                <FileText size={16} />
                Criar o Meu CV na Plataforma
              </Link>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <AlertCircle size={24} className="text-orange-500" />
              <h2 className="font-heading text-2xl font-bold text-k10-primary">Cuidados Importantes</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-5 border-l-4 border-red-400">
                <h3 className="font-semibold text-gray-900 mb-2">Fraudes e Esquemas</h3>
                <p className="text-gray-600 text-sm">
                  Nunca pagues para ser contratado. Empresas legítimas não cobram taxas de candidatura.
                  Desconfia de ofertas que parecem boas demais. Verifica sempre se a empresa existe e é real.
                </p>
              </div>
              <div className="card p-5 border-l-4 border-blue-400">
                <h3 className="font-semibold text-gray-900 mb-2">Dados Pessoais</h3>
                <p className="text-gray-600 text-sm">
                  Não partilhes dados bancários ou senhas em candidaturas. O número do BI e NIF só devem
                  ser partilhados quando fores efectivamente contratado.
                </p>
              </div>
              <div className="card p-5 border-l-4 border-green-400">
                <h3 className="font-semibold text-gray-900 mb-2">Direitos do Trabalhador</h3>
                <p className="text-gray-600 text-sm">
                  Pela Lei Geral do Trabalho de Angola, tens direito a contrato escrito, férias remuneradas,
                  segurança social e condições dignas de trabalho. Conhece os teus direitos.
                </p>
              </div>
              <div className="card p-5 border-l-4 border-purple-400">
                <h3 className="font-semibold text-gray-900 mb-2">Networking</h3>
                <p className="text-gray-600 text-sm">
                  Muitas oportunidades em Angola surgem por indicação. Participa nos grupos de comunidade
                  da K10, vai a eventos da tua área e mantém contactos profissionais activos.
                </p>
              </div>
            </div>
          </section>

          <section className="card p-6 gradient-hero text-white">
            <div className="text-center">
              <Building2 size={32} className="mx-auto mb-3 text-k10-gold" />
              <h2 className="font-heading text-xl font-bold mb-2">Precisa de Ajuda?</h2>
              <p className="text-gray-300 text-sm mb-4">A equipa K10 está disponível para te apoiar na tua jornada profissional.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
                <a href="tel:+244934859240" className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/20 transition-all">
                  <Phone size={16} />
                  +244 934 859 240
                </a>
                <a href="mailto:matiasdomingos158@gmail.com" className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl hover:bg-white/20 transition-all">
                  <Mail size={16} />
                  matiasdomingos158@gmail.com
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
