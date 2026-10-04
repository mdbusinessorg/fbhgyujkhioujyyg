'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { social } from '@/lib/social'
import AppHeader from '@/components/AppHeader'
import { Hash, Users, TrendingUp, CheckCircle } from 'lucide-react'

interface Community { area: string; members: number; posts: number }

export default function ComunidadesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [communities, setCommunities] = useState<Community[]>([])
  const [memberships, setMemberships] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [peopleRes, memberships, feedRes] = await Promise.all([
          supabase.from('users').select('id').limit(200),
          social.getCommunityMemberships(),
          social.getFeed('para-ti', undefined, 100, 0).catch(() => ({ posts: [] as any[] })),
        ])
        const feed: any[] = feedRes.posts || []

        const map: Record<string, { members: Set<string>; posts: number }> = {}
        memberships.forEach((m: any) => {
          if (!map[m.area]) map[m.area] = { members: new Set<string>(), posts: 0 }
          map[m.area].members.add(m.user_id)
        })
        feed.forEach(p => {
          const a = p.area || p.author?.area
          if (!a) return
          if (!map[a]) map[a] = { members: new Set<string>(), posts: 0 }
          if (p.user_id) map[a].members.add(p.user_id)
          if (p.author?.id) map[a].members.add(p.author.id)
          map[a].posts++
        })
        const extras = ['Dicas de CV', 'Entrevistas', 'Empreendedorismo', 'Freelance']
        const ids = (peopleRes.data || []).map((u: any) => u.id)
        extras.forEach(name => {
          if (!map[name]) map[name] = { members: new Set<string>(ids.slice(0, Math.floor(ids.length / 3))), posts: 0 }
        })

        setCommunities(
          Object.entries(map)
            .map(([area, c]) => ({ area, members: c.members.size, posts: c.posts }))
            .sort((a, b) => b.members - a.members)
        )
      } catch {}

      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user?.email) {
        const { data: u } = await supabase.from('users').select('id').eq('email', session.user.email).single()
        if (u) {
          setUser(u)
          try {
            const mine = await social.getCommunityMemberships(u.id)
            setMemberships(mine.map(m => m.area))
          } catch {}
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  const join = async (area: string) => {
    if (!user) { router.push('/auth/login/'); return }
    try {
      await social.joinCommunity(user.id, area)
      setMemberships(prev => [...prev, area])
      setCommunities(prev => prev.map(c => c.area === area ? { ...c, members: c.members + 1 } : c))
    } catch {}
  }

  const leave = async (area: string) => {
    if (!user) return
    try {
      await social.leaveCommunity(user.id, area)
      setMemberships(prev => prev.filter(a => a !== area))
      setCommunities(prev => prev.map(c => c.area === area ? { ...c, members: Math.max(0, c.members - 1) } : c))
    } catch {}
  }

  const open = (area: string) => router.push(`/pessoas/?tab=comunidades&area=${encodeURIComponent(area)}`)

  const mine = useMemo(() => communities.filter(c => memberships.includes(c.area)), [communities, memberships])
  const explore = useMemo(() => communities.filter(c => !memberships.includes(c.area)), [communities, memberships])

  const Card = ({ c, member }: { c: Community; member: boolean }) => (
    <div className="bg-white border border-ms-border rounded-2xl p-4 hover:border-ms-blue/40 hover:shadow-md transition-all">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-ms-dark flex items-center gap-1.5"><Hash size={14} className="text-ms-blue" />{c.area}</h4>
        <span className="bg-ms-surface text-ms-blue text-[10px] font-bold px-2 py-0.5 rounded-full">{c.members} {c.members === 1 ? 'membro' : 'membros'}</span>
      </div>
      <p className="text-[11px] text-ms-gray mt-1">{c.posts} {c.posts === 1 ? 'publicação recente' : 'publicações recentes'}</p>
      <div className="flex items-center gap-2 mt-3">
        <button onClick={() => open(c.area)} className="flex-1 text-center text-[11px] font-bold py-2 bg-ms-surface text-ms-dark rounded-xl hover:bg-ms-border">Ver grupo</button>
        {member ? (
          <button onClick={() => leave(c.area)} className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold py-2 bg-green-500 text-white rounded-xl hover:bg-green-600"><CheckCircle size={11} /> Membro</button>
        ) : (
          <button onClick={() => join(c.area)} className="flex-1 text-center text-[11px] font-bold py-2 bg-ms-blue text-white rounded-xl hover:bg-blue-700">Aderir</button>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-ms-surface">
      <AppHeader />

      <main className="max-w-4xl mx-auto px-4 pt-5 pb-16">
        <div className="flex items-center gap-2.5 mb-1">
          <Users size={20} className="text-ms-blue" />
          <h1 className="text-xl font-bold text-ms-dark">Comunidades</h1>
          {communities.length > 0 && <span className="text-xs font-bold bg-ms-blue/10 text-ms-blue px-2 py-0.5 rounded-full">{communities.length}</span>}
        </div>
        <p className="text-xs text-ms-gray mb-4">Grupos por área e interesse — adere para ver publicações no teu feed.</p>

        {loading ? (
          <div className="py-16 flex justify-center"><div className="w-8 h-8 border-2 border-ms-blue border-t-transparent rounded-full animate-spin" /></div>
        ) : communities.length === 0 ? (
          <div className="bg-white border border-ms-border rounded-2xl p-10 text-center">
            <Hash size={36} className="text-ms-gray mx-auto mb-3" />
            <p className="text-sm text-ms-dark font-medium">Ainda não há comunidades</p>
            <p className="text-xs text-ms-gray mt-1">Publica no feed com a tua área para formar a primeira.</p>
          </div>
        ) : (
          <>
            {mine.length > 0 && (
              <>
                <h2 className="text-sm font-bold text-ms-dark mb-2.5 flex items-center gap-1.5"><CheckCircle size={15} className="text-ms-blue" /> Minhas comunidades</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {mine.map(c => <Card key={c.area} c={c} member />)}
                </div>
              </>
            )}
            <h2 className="text-sm font-bold text-ms-dark mb-2.5 flex items-center gap-1.5"><TrendingUp size={15} className="text-ms-blue" /> Explorar comunidades</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {explore.map(c => <Card key={c.area} c={c} member={false} />)}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
