'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import JobsHeader from '@/components/JobsHeader'
import JobGridCard from '@/components/JobGridCard'
import { JOB_CATEGORIES } from '@/lib/jobCategories'
import { useFavorites } from '@/lib/favorites'
import { Star } from 'lucide-react'

type SavedJob = {
  key: string
  id: string
  href: string
  title: string
  company?: string
  location?: string
  category?: string
  salary?: string
  sourceType: 'internal' | 'external'
}

type InternalVaga = {
  id: string
  titulo?: string
  empresa_nome?: string
  localizacao?: string
  area?: string
  salario?: string
}

type ExternalVaga = {
  id: string
  title?: string
  company?: string
  location?: string
  category?: string
  salary?: string
}

export default function FavoritosPage() {
  const { favorites, isFavorite, toggle } = useFavorites()
  const [items, setItems] = useState<SavedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todas')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data } = await supabase.from('users').select('role, nome').eq('email', session.user.email).single()
        if (data) {
          setUserName(data.nome || '')
        }
      }
    }
    init()
  }, [])

  useEffect(() => {
    const loadFavorites = async () => {
      const internalIds = favorites.filter((key) => key.startsWith('int:')).map((key) => key.replace('int:', ''))
      const externalIds = favorites.filter((key) => key.startsWith('ext:')).map((key) => key.replace('ext:', ''))

      if (internalIds.length === 0 && externalIds.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      setLoading(true)

      const [internalResult, externalResults] = await Promise.all([
        internalIds.length > 0
          ? supabase.from('vagas').select('id, titulo, empresa_nome, localizacao, area, salario').in('id', internalIds)
          : Promise.resolve({ data: [] as InternalVaga[] }),
        Promise.all(
          externalIds.map(async (id) => {
            try {
              const res = await fetch(`/vagas-data/${encodeURIComponent(id)}.json`, { cache: 'no-store' })
              if (!res.ok) return null
              return (await res.json()) as ExternalVaga
            } catch {
              return null
            }
          })
        ),
      ])

      const internalMap = new Map<string, InternalVaga>()
      ;(internalResult.data || []).forEach((vaga: InternalVaga) => {
        internalMap.set(vaga.id, vaga)
      })

      const externalMap = new Map<string, ExternalVaga>()
      externalResults.forEach((vaga) => {
        if (vaga?.id) externalMap.set(vaga.id, vaga)
      })

      const nextItems = favorites
        .map((key): SavedJob | null => {
          if (key.startsWith('int:')) {
            const id = key.replace('int:', '')
            const vaga = internalMap.get(id)
            if (!vaga) return null
            return {
              key,
              id,
              href: `/vagas/detalhe/?id=${id}`,
              title: vaga.titulo || 'Vaga',
              company: vaga.empresa_nome || '',
              location: vaga.localizacao || '',
              category: vaga.area || 'MÔ SALO',
              salary: vaga.salario || '',
              sourceType: 'internal',
            }
          }

          if (key.startsWith('ext:')) {
            const id = key.replace('ext:', '')
            const vaga = externalMap.get(id)
            if (!vaga) return null
            return {
              key,
              id,
              href: `/vagas/externa/?id=${id}`,
              title: vaga.title || 'Vaga',
              company: vaga.company || '',
              location: vaga.location || '',
              category: vaga.category && vaga.category !== 'Outro' ? vaga.category : 'Externa',
              salary: vaga.salary || '',
              sourceType: 'external',
            }
          }

          return null
        })
        .filter((item): item is SavedJob => Boolean(item))

      setItems(nextItems)
      setLoading(false)
    }

    loadFavorites()
  }, [favorites])

  const activeCategoryLabel = JOB_CATEGORIES.find((item) => item.key === activeFilter)?.label || activeFilter

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const kw = searchQuery.trim().toLowerCase()
      const matchSearch = !kw || item.title.toLowerCase().includes(kw) || item.company?.toLowerCase().includes(kw) || item.location?.toLowerCase().includes(kw)
      const matchCategory = activeFilter === 'Todas' || item.category === activeCategoryLabel || item.category === activeFilter
      return matchSearch && matchCategory
    })
  }, [activeCategoryLabel, activeFilter, items, searchQuery])

  const handleToggleFavorite = (key: string, event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    toggle(key)
  }

  return (
    <div className="min-h-screen bg-white pb-24 lg:pb-0">
      <main className="mx-auto max-w-6xl px-4 pb-6 pt-4 lg:px-8 lg:pt-6">
        <JobsHeader
          userName={userName || 'Utilizador'}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={activeFilter}
          onCategoryChange={setActiveFilter}
          categories={JOB_CATEGORIES}
          onFilterClick={() => setActiveFilter('Todas')}
        />

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ms-blue border-t-transparent" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <Star size={32} className="mx-auto mb-3 text-ms-gray" />
            <p className="text-sm text-ms-gray">Ainda não guardaste nenhuma vaga.</p>
            <Link href="/vagas/" className="mt-2 inline-block text-sm font-medium text-ms-blue">
              Explorar vagas →
            </Link>
          </div>
        ) : (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Star size={16} className="fill-amber-500 text-amber-500" />
                <h2 className="text-sm font-semibold text-ms-dark">Vagas guardadas</h2>
              </div>
              <span className="text-xs text-ms-gray">{filteredItems.length} vagas</span>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <JobGridCard
                  key={item.key}
                  href={item.href}
                  title={item.title}
                  subtitle={[item.company, item.location].filter(Boolean).join(' • ') || 'Angola'}
                  chip={item.category || (item.sourceType === 'external' ? 'Externa' : 'MÔ SALO')}
                  initials={item.company || item.title || 'MS'}
                  favoriteKey={item.key}
                  favorite={isFavorite(item.key)}
                  salary={item.salary}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav active="favoritos" userRole="candidato" />
    </div>
  )
}
