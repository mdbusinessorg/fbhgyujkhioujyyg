'use client'

export interface CvProfile {
  nome: string
  email: string
  telefone: string
  area?: string
  localizacao?: string
  nivel_academico?: string
  bio?: string
  experiencias?: string
  competencias?: string
}

interface CvTemplateProps {
  template: 'classic' | 'modern' | 'minimal' | 'professional'
  profile: CvProfile
  className?: string
  style?: React.CSSProperties
}

function parseList(text?: string): string[] {
  if (!text) return []
  return text.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean)
}

export default function CvTemplate({ template, profile, className = '', style }: CvTemplateProps) {
  const competencias = parseList(profile.competencias)
  const experiencias = parseList(profile.experiencias)
  const email = profile.email || ''
  const telefone = profile.telefone || ''
  const localizacao = profile.localizacao || ''

  const base: React.CSSProperties = {
    width: '794px',
    minHeight: '1123px',
    padding: '48px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    color: '#1f2937',
    background: '#ffffff',
    lineHeight: 1.4,
    boxSizing: 'border-box',
  }

  const headingStyle: React.CSSProperties = { fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', color: '#1A56FF', fontWeight: 700, marginBottom: '8px', marginTop: '20px' }
  const textStyle: React.CSSProperties = { fontSize: '11px', color: '#374151' }

  if (template === 'classic') {
    return (
      <div className={`cv-template ${className}`} style={{ ...base, ...style }}>
        <div style={{ borderBottom: '2px solid #1A56FF', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#111827', margin: 0 }}>{profile.nome || 'Nome'}</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{profile.area || 'Área profissional'}</p>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px', color: '#4b5563', marginTop: '8px' }}>
            {email && <span>{email}</span>}
            {telefone && <span>{telefone}</span>}
            {localizacao && <span>{localizacao}</span>}
          </div>
        </div>

        {profile.bio && (
          <section>
            <div style={headingStyle}>Perfil</div>
            <p style={textStyle}>{profile.bio}</p>
          </section>
        )}

        <section>
          <div style={headingStyle}>Experiência Profissional</div>
          {experiencias.length ? experiencias.map((e, i) => <p key={i} style={{ ...textStyle, marginBottom: '6px' }}>• {e}</p>) : <p style={textStyle}>Ainda sem experiência registada.</p>}
        </section>

        <section>
          <div style={headingStyle}>Educação</div>
          <p style={textStyle}>{profile.nivel_academico || 'Nível académico não informado'}</p>
        </section>

        <section>
          <div style={headingStyle}>Competências</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {competencias.length ? competencias.map((c, i) => <span key={i} style={{ background: '#eff6ff', color: '#1A56FF', fontSize: '10px', padding: '3px 8px', borderRadius: '12px' }}>{c}</span>) : <span style={textStyle}>Nenhuma competência registada.</span>}
          </div>
        </section>
      </div>
    )
  }

  if (template === 'modern') {
    return (
      <div className={`cv-template ${className}`} style={{ ...base, padding: 0, ...style }}>
        <div style={{ background: 'linear-gradient(135deg, #1A56FF 0%, #6C47FF 100%)', color: '#fff', padding: '48px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 700, margin: 0 }}>{profile.nome || 'Nome'}</h1>
          <p style={{ fontSize: '15px', opacity: 0.9, marginTop: '6px' }}>{profile.area || 'Área profissional'}</p>
          <div style={{ display: 'flex', gap: '20px', fontSize: '11px', marginTop: '12px', opacity: 0.95 }}>
            {email && <span>{email}</span>}
            {telefone && <span>{telefone}</span>}
            {localizacao && <span>{localizacao}</span>}
          </div>
        </div>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '30%', background: '#f3f4f6', padding: '32px 24px', minHeight: '850px' }}>
            <div style={{ ...headingStyle, color: '#6C47FF' }}>Contactos</div>
            <div style={{ ...textStyle, marginBottom: '6px' }}>{email}</div>
            <div style={{ ...textStyle, marginBottom: '6px' }}>{telefone}</div>
            <div style={{ ...textStyle, marginBottom: '6px' }}>{localizacao}</div>

            <div style={{ ...headingStyle, color: '#6C47FF' }}>Competências</div>
            {competencias.map((c, i) => <div key={i} style={{ ...textStyle, marginBottom: '4px' }}>• {c}</div>)}

            <div style={{ ...headingStyle, color: '#6C47FF' }}>Educação</div>
            <p style={textStyle}>{profile.nivel_academico || '—'}</p>
          </div>
          <div style={{ width: '70%', padding: '32px' }}>
            {profile.bio && (
              <>
                <div style={headingStyle}>Perfil</div>
                <p style={textStyle}>{profile.bio}</p>
              </>
            )}
            <div style={headingStyle}>Experiência Profissional</div>
            {experiencias.length ? experiencias.map((e, i) => <p key={i} style={{ ...textStyle, marginBottom: '8px' }}>• {e}</p>) : <p style={textStyle}>Ainda sem experiência registada.</p>}
          </div>
        </div>
      </div>
    )
  }

  if (template === 'minimal') {
    return (
      <div className={`cv-template ${className}`} style={{ ...base, textAlign: 'center', ...style }}>
        <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '24px' }}>
          <h1 style={{ fontSize: '30px', fontWeight: 300, letterSpacing: '2px', margin: 0 }}>{profile.nome || 'Nome'}</h1>
          <p style={{ fontSize: '14px', color: '#6b7280', fontStyle: 'italic', marginTop: '6px' }}>{profile.area || 'Área profissional'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '18px', fontSize: '11px', color: '#6b7280', marginTop: '10px' }}>
            {email && <span>{email}</span>}
            {telefone && <span>{telefone}</span>}
            {localizacao && <span>{localizacao}</span>}
          </div>
        </div>

        {profile.bio && (
          <section>
            <div style={{ ...headingStyle, textAlign: 'left', borderBottom: '2px solid #1A56FF', display: 'inline-block', width: '100%' }}>Perfil</div>
            <p style={{ ...textStyle, textAlign: 'left' }}>{profile.bio}</p>
          </section>
        )}

        <section>
          <div style={{ ...headingStyle, textAlign: 'left', borderBottom: '2px solid #1A56FF', display: 'inline-block', width: '100%' }}>Experiência Profissional</div>
          {experiencias.length ? experiencias.map((e, i) => <p key={i} style={{ ...textStyle, textAlign: 'left', marginBottom: '6px' }}>• {e}</p>) : <p style={{ ...textStyle, textAlign: 'left' }}>Ainda sem experiência registada.</p>}
        </section>

        <section>
          <div style={{ ...headingStyle, textAlign: 'left', borderBottom: '2px solid #1A56FF', display: 'inline-block', width: '100%' }}>Educação</div>
          <p style={{ ...textStyle, textAlign: 'left' }}>{profile.nivel_academico || 'Nível académico não informado'}</p>
        </section>

        <section>
          <div style={{ ...headingStyle, textAlign: 'left', borderBottom: '2px solid #1A56FF', display: 'inline-block', width: '100%' }}>Competências</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-start', gap: '8px' }}>
            {competencias.length ? competencias.map((c, i) => <span key={i} style={{ border: '1px solid #1A56FF', color: '#1A56FF', fontSize: '10px', padding: '3px 8px', borderRadius: '12px' }}>{c}</span>) : <span style={{ ...textStyle, textAlign: 'left' }}>Nenhuma competência registada.</span>}
          </div>
        </section>
      </div>
    )
  }

  // professional
  return (
    <div className={`cv-template ${className}`} style={{ ...base, padding: 0, display: 'flex', ...style }}>
      <div style={{ width: '34%', background: '#1A56FF', color: '#fff', padding: '40px 28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>{profile.nome || 'Nome'}</h1>
        <p style={{ fontSize: '12px', opacity: 0.9, marginTop: '6px' }}>{profile.area || 'Área profissional'}</p>

        <div style={{ marginTop: '28px', fontSize: '11px', opacity: 0.95 }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', marginBottom: '8px' }}>Contactos</div>
          {email && <div style={{ marginBottom: '6px' }}>{email}</div>}
          {telefone && <div style={{ marginBottom: '6px' }}>{telefone}</div>}
          {localizacao && <div style={{ marginBottom: '6px' }}>{localizacao}</div>}
        </div>

        <div style={{ marginTop: '28px' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', marginBottom: '8px' }}>Competências</div>
          {competencias.length ? competencias.map((c, i) => <div key={i} style={{ fontSize: '11px', marginBottom: '5px', paddingLeft: '10px', position: 'relative' }}><span style={{ position: 'absolute', left: 0 }}>•</span>{c}</div>) : <div style={{ fontSize: '11px', opacity: 0.9 }}>—</div>}
        </div>

        <div style={{ marginTop: '28px' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '10px', letterSpacing: '1px', marginBottom: '8px' }}>Educação</div>
          <p style={{ fontSize: '11px', opacity: 0.95 }}>{profile.nivel_academico || '—'}</p>
        </div>
      </div>
      <div style={{ width: '66%', padding: '40px' }}>
        {profile.bio && (
          <section>
            <div style={headingStyle}>Perfil</div>
            <p style={textStyle}>{profile.bio}</p>
          </section>
        )}
        <section>
          <div style={headingStyle}>Experiência Profissional</div>
          {experiencias.length ? experiencias.map((e, i) => <p key={i} style={{ ...textStyle, marginBottom: '8px' }}>• {e}</p>) : <p style={textStyle}>Ainda sem experiência registada.</p>}
        </section>
      </div>
    </div>
  )
}
