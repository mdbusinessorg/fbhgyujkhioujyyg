'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import CvTemplate, { type CvProfile } from './CvTemplate'
import { ArrowLeft, FileText, Download, Loader2 } from 'lucide-react'
import { saveAs } from 'file-saver'
import { jsPDF } from 'jspdf'
import * as docx from 'docx'

const TEMPLATES = [
  { key: 'classic' as const, name: 'Clássico ATS', desc: 'Limpo, legível por ATS, cores sóbrias.' },
  { key: 'modern' as const, name: 'Moderno', desc: 'Cabeçalho em gradiente e layout em colunas.' },
  { key: 'minimal' as const, name: 'Minimalista', desc: 'Elegante, centrado, com linhas finas.' },
  { key: 'professional' as const, name: 'Profissional', desc: 'Barra lateral azul e estrutura sólida.' },
]

function parseList(text?: string): string[] {
  if (!text) return []
  return text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
}

export default function CvBuilder() {
  const [profile, setProfile] = useState<CvProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const printRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) { setLoading(false); return }
      const { data: u } = await supabase.from('users').select('id, nome, email, telefone').eq('email', session.user.email).single()
      if (!u) { setLoading(false); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('user_id', u.id).single()
      setProfile({
        nome: u.nome || session.user.email?.split('@')[0] || 'Nome',
        email: u.email || session.user.email || '',
        telefone: u.telefone || '',
        area: p?.area || '',
        localizacao: p?.localizacao || '',
        nivel_academico: p?.nivel_academico || '',
        bio: p?.bio || '',
        experiencias: p?.experiencias || '',
        competencias: typeof p?.competencias === 'string' ? p.competencias : Array.isArray(p?.competencias) ? p.competencias.join(', ') : '',
      })
      setLoading(false)
    }
    load()
  }, [])

  const competencias = parseList(profile?.competencias)
  const experiencias = parseList(profile?.experiencias)

  const generateWord = async (template: string) => {
    if (!profile) return
    setGenerating(`word-${template}`)
    const doc = buildDocx(template, profile, experiencias, competencias)
    const blob = await docx.Packer.toBlob(doc)
    saveAs(blob, `cv-${profile.nome.replace(/\s+/g, '_')}-${template}.docx`)
    setGenerating(null)
  }

  const generatePdf = async (template: string) => {
    if (!profile) return
    setGenerating(`pdf-${template}`)
    const el = printRefs.current[template]
    if (!el) { setGenerating(null); return }

    const pdf = new jsPDF('p', 'mm', 'a4')
    try {
      await new Promise<void>((resolve, reject) => {
        pdf.html(el, {
          callback: (doc: jsPDF) => {
            try {
              doc.save(`cv-${profile.nome.replace(/\s+/g, '_')}-${template}.pdf`)
              resolve()
            } catch (e) { reject(e) }
          },
          x: 0,
          y: 0,
          width: 210,
          windowWidth: 794,
          autoPaging: 'text',
          margin: [0, 0, 0, 0],
        } as any)
      })
    } catch {
      // fallback to html2canvas image
      const canvas = await import('html2canvas').then(mod => mod.default(el, { scale: 2, backgroundColor: '#ffffff' }))
      const imgData = canvas.toDataURL('image/png')
      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      let heightLeft = pdfHeight
      let position = 0
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
      heightLeft -= pdf.internal.pageSize.getHeight()
      while (heightLeft > 0) {
        position = heightLeft - pdfHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight)
        heightLeft -= pdf.internal.pageSize.getHeight()
      }
      pdf.save(`cv-${profile.nome.replace(/\s+/g, '_')}-${template}.pdf`)
    }
    setGenerating(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ms-surface">
        <div className="w-10 h-10 border-2 border-ms-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-ms-surface p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-ms-border text-center max-w-md">
          <h1 className="text-lg font-bold text-ms-dark mb-2">Inicia sessão</h1>
          <p className="text-sm text-ms-gray mb-4">Precisas de estar logado para gerares o teu CV.</p>
          <Link href="/auth/login/" className="btn-primary inline-block">Entrar</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ms-surface pb-24">
      <header className="bg-white border-b border-ms-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-ms-surface rounded-full"><ArrowLeft size={20} className="text-ms-dark" /></Link>
          <div>
            <h1 className="text-lg font-bold text-ms-dark">Modelos de CV</h1>
            <p className="text-xs text-ms-gray">Escolhe um modelo e descarrega em Word ou PDF.</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TEMPLATES.map(t => (
            <div key={t.key} className="bg-white rounded-2xl border border-ms-border p-4 shadow-sm flex flex-col">
              <div className="text-sm font-bold text-ms-dark mb-1">{t.name}</div>
              <p className="text-xs text-ms-gray mb-3">{t.desc}</p>
              <div className="bg-gray-50 rounded-xl border border-ms-border overflow-hidden flex-1 relative" style={{ height: '220px' }}>
                <div className="absolute top-0 left-0" style={{ transform: 'scale(0.22)', transformOrigin: 'top left' }}>
                  <CvTemplate template={t.key} profile={profile} />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => generateWord(t.key)} disabled={!!generating} className="flex-1 btn-outline text-xs flex items-center justify-center gap-1 py-2">
                  {generating === `word-${t.key}` ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                  Word
                </button>
                <button onClick={() => generatePdf(t.key)} disabled={!!generating} className="flex-1 btn-primary text-xs flex items-center justify-center gap-1 py-2">
                  {generating === `pdf-${t.key}` ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <div className="fixed -left-[9999px] top-0">
        {TEMPLATES.map(t => (
          <div key={`print-${t.key}`} ref={el => { printRefs.current[t.key] = el }}>
            <CvTemplate template={t.key} profile={profile} />
          </div>
        ))}
      </div>
    </div>
  )
}

function buildDocx(template: string, profile: CvProfile, experiencias: string[], competencias: string[]) {
  const email = profile.email || ''
  const telefone = profile.telefone || ''
  const localizacao = profile.localizacao || ''

  const borderNone = { style: docx.BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const noBorders = { top: borderNone, bottom: borderNone, left: borderNone, right: borderNone, insideHorizontal: borderNone, insideVertical: borderNone }

  const h = (text: string, color = '#1A56FF') => new docx.Paragraph({
    text,
    heading: docx.HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    thematicBreak: false,
    border: { bottom: { color, space: 1, style: docx.BorderStyle.SINGLE, size: 6 } },
  })

  const p = (text: string, options: any = {}) => new docx.Paragraph({ children: [new docx.TextRun({ text, size: 20, ...options })] })
  const bullet = (text: string) => new docx.Paragraph({ children: [new docx.TextRun({ text: `• ${text}`, size: 20 })], spacing: { after: 60 } })

  const sectionChildren: docx.Paragraph[] = []

  if (template === 'classic') {
    sectionChildren.push(
      new docx.Paragraph({
        children: [new docx.TextRun({ text: profile.nome || 'Nome', bold: true, size: 36, color: '#111827' })],
        spacing: { after: 80 },
      }),
      new docx.Paragraph({
        children: [new docx.TextRun({ text: profile.area || 'Área profissional', size: 22, color: '#6b7280' })],
        spacing: { after: 120 },
      }),
      new docx.Paragraph({
        children: [
          email && new docx.TextRun({ text: email + '   ', size: 18, color: '#4b5563' }),
          telefone && new docx.TextRun({ text: telefone + '   ', size: 18, color: '#4b5563' }),
          localizacao && new docx.TextRun({ text: localizacao, size: 18, color: '#4b5563' }),
        ].filter(Boolean) as docx.TextRun[],
        spacing: { after: 200 },
        border: { bottom: { color: '#1A56FF', space: 1, style: docx.BorderStyle.SINGLE, size: 12 } },
      })
    )
    if (profile.bio) { sectionChildren.push(h('Perfil'), p(profile.bio)) }
    sectionChildren.push(h('Experiência Profissional'))
    experiencias.length ? experiencias.forEach(e => sectionChildren.push(bullet(e))) : sectionChildren.push(p('Ainda sem experiência registada.'))
    sectionChildren.push(h('Educação'), p(profile.nivel_academico || 'Nível académico não informado'))
    sectionChildren.push(h('Competências'))
    sectionChildren.push(p(competencias.join(' • ') || 'Nenhuma competência registada.'))
  } else if (template === 'modern') {
    const leftCell = new docx.TableCell({
      width: { size: 30, type: docx.WidthType.PERCENTAGE },
      shading: { fill: '#f3f4f6', type: docx.ShadingType.CLEAR },
      children: [
        new docx.Paragraph({ text: 'Contactos', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 100, after: 80 } }),
        p(email), p(telefone), p(localizacao),
        new docx.Paragraph({ text: 'Competências', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }),
        ...competencias.map(c => bullet(c)),
        new docx.Paragraph({ text: 'Educação', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }),
        p(profile.nivel_academico || '—'),
      ],
    })
    const rightCell = new docx.TableCell({
      width: { size: 70, type: docx.WidthType.PERCENTAGE },
      children: [
        new docx.Paragraph({ children: [new docx.TextRun({ text: profile.nome, bold: true, size: 36, color: '#111827' })], spacing: { after: 60 } }),
        new docx.Paragraph({ children: [new docx.TextRun({ text: profile.area || 'Área profissional', size: 22, color: '#6b7280' })], spacing: { after: 120 } }),
        profile.bio ? new docx.Paragraph({ text: 'Perfil', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 100, after: 80 } }) : new docx.Paragraph({ text: '' }),
        profile.bio ? p(profile.bio) : new docx.Paragraph({ text: '' }),
        new docx.Paragraph({ text: 'Experiência Profissional', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }),
        ...experiencias.map(e => bullet(e)),
      ],
    })
    const table = new docx.Table({ rows: [new docx.TableRow({ children: [leftCell, rightCell] })], width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders: noBorders })
    return new docx.Document({ sections: [{ properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } }, children: [table] }] })
  } else if (template === 'minimal') {
    sectionChildren.push(
      new docx.Paragraph({ children: [new docx.TextRun({ text: profile.nome, bold: true, size: 36, color: '#111827' })], alignment: docx.AlignmentType.CENTER, spacing: { after: 60 } }),
      new docx.Paragraph({ children: [new docx.TextRun({ text: profile.area || 'Área profissional', size: 22, italics: true, color: '#6b7280' })], alignment: docx.AlignmentType.CENTER, spacing: { after: 100 } }),
      new docx.Paragraph({
        children: [email && new docx.TextRun({ text: email + ' • ', size: 18, color: '#6b7280' }), telefone && new docx.TextRun({ text: telefone + ' • ', size: 18, color: '#6b7280' }), localizacao && new docx.TextRun({ text: localizacao, size: 18, color: '#6b7280' })].filter(Boolean) as docx.TextRun[],
        alignment: docx.AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    )
    if (profile.bio) { sectionChildren.push(h('Perfil'), p(profile.bio)) }
    sectionChildren.push(h('Experiência Profissional'))
    experiencias.length ? experiencias.forEach(e => sectionChildren.push(bullet(e))) : sectionChildren.push(p('Ainda sem experiência registada.'))
    sectionChildren.push(h('Educação'), p(profile.nivel_academico || 'Nível académico não informado'))
    sectionChildren.push(h('Competências'), p(competencias.join(' • ') || 'Nenhuma competência registada.'))
  } else {
    // professional
    const leftCell = new docx.TableCell({
      width: { size: 34, type: docx.WidthType.PERCENTAGE },
      shading: { fill: '#1A56FF', type: docx.ShadingType.CLEAR },
      children: [
        new docx.Paragraph({ children: [new docx.TextRun({ text: profile.nome, bold: true, size: 28, color: '#ffffff' })], spacing: { after: 60 } }),
        new docx.Paragraph({ children: [new docx.TextRun({ text: profile.area || '', size: 20, color: '#ffffff' })], spacing: { after: 200 } }),
        new docx.Paragraph({ children: [new docx.TextRun({ text: 'Contactos', bold: true, size: 18, color: '#ffffff' })], spacing: { after: 80 } }),
        p(email, { color: '#ffffff' }), p(telefone, { color: '#ffffff' }), p(localizacao, { color: '#ffffff' }),
        new docx.Paragraph({ children: [new docx.TextRun({ text: 'Competências', bold: true, size: 18, color: '#ffffff' })], spacing: { before: 200, after: 80 } }),
        ...competencias.map(c => new docx.Paragraph({ children: [new docx.TextRun({ text: `• ${c}`, size: 18, color: '#ffffff' })], spacing: { after: 40 } })),
        new docx.Paragraph({ children: [new docx.TextRun({ text: 'Educação', bold: true, size: 18, color: '#ffffff' })], spacing: { before: 200, after: 80 } }),
        p(profile.nivel_academico || '—', { color: '#ffffff' }),
      ],
    })
    const rightCell = new docx.TableCell({
      width: { size: 66, type: docx.WidthType.PERCENTAGE },
      children: [
        profile.bio ? new docx.Paragraph({ text: 'Perfil', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 100, after: 80 } }) : new docx.Paragraph({ text: '' }),
        profile.bio ? p(profile.bio) : new docx.Paragraph({ text: '' }),
        new docx.Paragraph({ text: 'Experiência Profissional', heading: docx.HeadingLevel.HEADING_2, spacing: { before: 200, after: 80 } }),
        ...experiencias.map(e => bullet(e)),
      ],
    })
    const table = new docx.Table({ rows: [new docx.TableRow({ children: [leftCell, rightCell] })], width: { size: 100, type: docx.WidthType.PERCENTAGE }, borders: noBorders })
    return new docx.Document({ sections: [{ properties: { page: { margin: { top: 0, right: 0, bottom: 0, left: 0 } } }, children: [table] }] })
  }

  return new docx.Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: sectionChildren,
    }],
  })
}
