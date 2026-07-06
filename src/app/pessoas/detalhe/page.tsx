'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UserAvatar from '@/components/UserAvatar'
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  ChevronRight,
  GraduationCap,
  MapPin,
  MessageSquare,
  Send,
  Share2,
  Star,
  Award,
  School,
} from 'lucide-react'

interface PersonProfile {
  user_id: string
  area?: string
  localizacao?: string
  nivel_academico?: string
  bio?: string
  experiencias?: string
  competencias?: string
}

interface PersonUser {
  id: string
  nome: string
  email: string
  role: string
  telefone?: string
}

function PessoasDetalheContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const id = searchParams.get('id')
  const [loading, setLoading] = useState(true)
  const [person, setPerson] = useState<PersonUser | null>(null)
  const [profile, setProfile] = useState<PersonProfile | null>(null)
  const [currentUserId, setCurrentUserId] = useState('')
  const [activeTab, setActiveTab] = useState<'sobre' | 'experiencia' | 'certificacoes'>('sobre')
  const [sharing, setSharing] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/auth/login/')
        return
      }

      const { data: current } = await supabase.from('users').select('id').eq('email', session.user.email).single()
      if (current) setCurrentUserId(current.id)

      if (!id) {
        setLoading(false)
        return
      }

      const { data: user } = await supabase.from('users').select('id, nome, email, role, telefone').eq('id', id).single()
      const { data: prof } = await supabase.from('profiles').select('user_id, area, localizacao, nivel_academico, bio, experiencias, competencias').eq('user_id', id).single()

      if (user) setPerson(user)
      if (prof) setProfile(prof)
      setLoading(false)
    }

    load()
  }, [id, router])

  const competencias = useMemo(() => {
    const raw = profile?.competencias
    if (!raw) return []
    if (Array.isArray(raw)) return raw.map(c => String(c).trim()).filter(Boolean)
    const trimmed = String(raw).trim()
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed)) return parsed.map(c => String(c).trim()).filter(Boolean)
      } catch {
        // ignore
      }
    }
    return trimmed.split(',').map(c => c.trim()).filter(Boolean)
  }, [profile?.competencias])

  const shareProfile = async () => {
    if (!person) return
    const url = window.location.href
    const title = `${person.nome} — MÔ SALO`
    setSharing(true)
    try {
      if (navigator.share) {
        await navigator.share({ title, url })
      } else {
        await navigator.clipboard.writeText(url)
        alert('Link do perfil copiado!')
      }
    } catch {
      // ignore
    }
    setSharing(false)
  }

  const startConversation = async () => {
    if (!person || !currentUserId) return
    if (person.id === currentUserId) return

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(`and(participant_1_id.eq.${currentUserId},participant_2_id.eq.${person.id}),and(participant_1_id.eq.${person.id},participant_2_id.eq.${currentUserId})`)
      .maybeSingle()

    if (existing) {
      router.push(`/mensagens/?conv=${existing.id}`)
      return
    }

    const { data: conv, error } = await supabase.from('conversations').insert({
      participant_1_id: currentUserId,
      participant_2_id: person.id,
    }).select('id').single()

    if (error) {
      alert('Erro ao criar conversa: ' + error.message)
      return
    }

    router.push(`/mensagens/?conv=${conv.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ms-blue border-t-transparent" />
      </div>
    )
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-ms-gray mb-4">Perfil não encontrado</p>
          <Link href="/pessoas/" className="text-ms-blue font-medium">← Voltar ao diretório</Link>
        </div>
      </div>
    )
  }

  const stats = [
    profile?.localizacao ? { icon: MapPin, label: 'Localização', value: profile.localizacao } : null,
    profile?.nivel_academico ? { icon: GraduationCap, label: 'Nível académico', value: profile.nivel_academico } : null,
    competencias.length > 0 ? { icon: Star, label: 'Competências', value: `${competencias.length}` } : null,
  ].filter(Boolean) as Array<{ icon: any; label: string; value: string }>

  const ctaDisabled = person.id === currentUserId

  return (
    <div className="min-h-screen bg-ms-surface pb-36">
      <main className="mx-auto max-w-4xl pb-6">
        <section className="relative overflow-hidden bg-gradient-to-br from-ms-blue to-ms-purple px-4 pb-10 pt-5 text-white">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute -left-8 top-6 h-24 w-24 rounded-full border border-white/40" />
            <div className="absolute right-6 top-12 h-16 w-16 rounded-full border border-white/30" />
            <div className="absolute bottom-0 left-1/2 h-28 w-28 -translate-x-1/2 translate-y-1/2 rounded-full border border-white/20" />
          </div>

          <div className="relative mx-auto flex max-w-4xl items-center justify-between">
            <button onClick={() => router.back()} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10" aria-label="Voltar">
              <ArrowLeft size={20} />
            </button>
            <UserAvatar userId={person.id} name={person.nome} size={84} className="border-4 border-white/20 shadow-lg" fallbackClassName="bg-white/15 text-white" />
            <div className="flex items-center gap-2">
              <button onClick={shareProfile} disabled={sharing} className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10 disabled:opacity-60" aria-label="Partilhar perfil">
                <Share2 size={18} />
              </button>
              <button
                type="button"
                onClick={startConversation}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-ms-dark shadow-lg shadow-black/10 disabled:opacity-50"
                aria-label="Enviar mensagem"
                disabled={ctaDisabled}
              >
                <MessageSquare size={18} />
              </button>
            </div>
          </div>

          <div className="relative mx-auto mt-8 max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">MÔ SALO</p>
            <h1 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">{person.nome}</h1>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-white/85">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                <BadgeCheck size={14} /> Perfil verificado
              </span>
              {profile?.area && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1">
                  <Briefcase size={14} /> {profile.area}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="relative -mt-8 rounded-t-[28px] bg-white px-4 pb-6 pt-6 shadow-[0_-18px_40px_rgba(17,24,39,0.08)] sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="flex items-center justify-center gap-2 rounded-full border border-ms-border bg-ms-surface px-3 py-2 text-xs font-medium text-ms-gray">
              <BadgeCheck size={14} className="text-ms-blue" /> Talento MÔ SALO
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-ms-gray">
              <MapPin size={14} /> {profile?.localizacao || 'Localização não indicada'}
            </div>

            <div className="mt-5 flex items-center justify-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ms-surface text-ms-blue">
                <Briefcase size={22} />
              </div>
              <div className="min-w-0 text-center">
                <p className="text-sm font-semibold text-ms-dark">{profile?.area || 'Cargo não indicado'}</p>
                <p className="text-xs text-ms-gray">{person.role === 'recrutador' ? 'Recrutador' : 'Candidato'}</p>
              </div>
            </div>

            {stats.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.map((stat, index) => {
                  const Icon = stat.icon
                  return (
                    <div key={index} className="rounded-2xl border border-ms-border bg-ms-surface p-4">
                      <div className="flex items-center gap-2 text-ms-blue">
                        <Icon size={16} />
                        <span className="text-[11px] font-medium text-ms-gray">{stat.label}</span>
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-snug text-ms-dark">{stat.value}</p>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="mt-6 border-b border-ms-border">
              <div className="flex gap-6 overflow-x-auto text-sm font-semibold scrollbar-hide">
                {[
                  { key: 'sobre', label: 'Sobre' },
                  { key: 'experiencia', label: 'Experiência' },
                  { key: 'certificacoes', label: 'Certificações' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`pb-3 transition-colors ${activeTab === tab.key ? 'border-b-2 border-ms-blue text-ms-blue' : 'text-ms-gray'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 space-y-5">
              {activeTab === 'sobre' && (
                <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
                  <h2 className="text-sm font-semibold text-ms-dark">Sobre</h2>
                  {profile?.bio ? (
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ms-gray">{profile.bio}</p>
                  ) : (
                    <p className="mt-3 text-sm text-ms-gray">Sem descrição adicionada.</p>
                  )}
                </div>
              )}

              {activeTab === 'experiencia' && (
                <div className="space-y-3">
                  {profile?.experiencias ? (
                    <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue">
                          <ChevronRight size={14} />
                        </div>
                        <p className="text-sm leading-relaxed text-ms-dark whitespace-pre-line">{profile.experiencias}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-ms-border bg-white p-5 text-sm text-ms-gray shadow-sm">Sem experiência adicionada.</div>
                  )}
                </div>
              )}

              {activeTab === 'certificacoes' && (
                <div className="space-y-3">
                  {profile?.nivel_academico && (
                    <div className="rounded-2xl border border-ms-border bg-white p-5 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue">
                          <School size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ms-gray">Nível académico</p>
                          <p className="mt-1 text-sm font-semibold text-ms-dark">{profile.nivel_academico}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {competencias.map((item, index) => (
                    <div key={index} className="flex items-start justify-between gap-4 rounded-2xl border border-ms-border bg-white p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-ms-blue/10 text-ms-blue">
                          <Award size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ms-gray">Competência</p>
                          <p className="mt-1 text-sm font-semibold text-ms-dark">{item}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {!profile?.nivel_academico && competencias.length === 0 && (
                    <div className="rounded-2xl border border-ms-border bg-white p-5 text-sm text-ms-gray shadow-sm">
                      Sem certificações ou competências adicionadas.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-ms-border bg-white p-4 shadow-[0_-10px_30px_rgba(17,24,39,0.08)]">
        <div className="mx-auto max-w-4xl">
          {ctaDisabled ? (
            <button
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl bg-ms-blue px-4 py-3.5 text-base font-semibold text-white opacity-60"
            >
              <Send size={16} /> Enviar mensagem
            </button>
          ) : (
            <button
              onClick={startConversation}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ms-blue px-4 py-3.5 text-base font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <Send size={16} /> Enviar mensagem
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function PessoasDetalhePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-ms-blue border-t-transparent" /></div>}>
      <PessoasDetalheContent />
    </Suspense>
  )
}
