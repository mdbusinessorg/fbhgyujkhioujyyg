'use client'

import { useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { detectValences, getStage, STAGE_ORDER, STAGE_LABELS, STAGE_COLORS, type ATSStage, drawWinners } from '@/lib/ats'
import { Toast } from './Toast'
import { Users, Search, Zap, Shuffle, ChevronRight, ChevronLeft, Star, Award, BrainCircuit, Trophy, X, Filter, Sparkles, TrendingUp, MessageSquare, Download, CheckCircle, XCircle, User } from 'lucide-react'

interface ATSProps {
  role: 'recrutador' | 'admin'
  vagas: any[]
  candidatos: any[]
  onUpdate: () => void
}

function scoreFor(c: any) {
  return c?.atsScore ?? c?.matchScore ?? c?.score ?? 0
}

export function ATS({ role, vagas, candidatos, onUpdate }: ATSProps) {
  const [selectedVaga, setSelectedVaga] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<ATSStage | 'all'>('all')
  const [drawOpen, setDrawOpen] = useState(false)
  const [drawCount, setDrawCount] = useState(1)
  const [drawWinnersState, setDrawWinnersState] = useState<any[] | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [toast, setToast] = useState<{ message: string; sub?: string } | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const filteredVagas = useMemo(() => {
    if (role === 'recrutador') return vagas
    return vagas
  }, [vagas, role])

  const candidates = useMemo(() => {
    let list = candidatos
    if (selectedVaga !== 'all') list = list.filter(c => c.vaga_id === selectedVaga)
    if (stageFilter !== 'all') list = list.filter(c => getStage(c) === stageFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => (c.users?.nome || '').toLowerCase().includes(q) || (c.users?.email || '').toLowerCase().includes(q))
    }
    return list
  }, [candidatos, selectedVaga, stageFilter, search])

  const candidatesByStage = useMemo(() => {
    const map: Record<ATSStage, any[]> = { recebida: [], triagem: [], entrevista: [], teste: [], concorrencia: [], pre_selecionados: [], contratado: [], rejeitado: [] }
    candidates.forEach(c => { map[getStage(c)].push(c) })
    return map
  }, [candidates])

  const detectAndSave = async (c: any) => {
    const vaga = c.vagas || vagas.find(v => v.id === c.vaga_id)
    if (!vaga) return
    const jobText = `${vaga.titulo || ''} ${vaga.descricao || ''} ${vaga.requisitos || ''}`
    const profile = c.profiles || {}
    const candText = `${profile.competencias || ''} ${profile.experiencias || ''} ${profile.bio || ''} ${c.mensagem || ''}`
    const result = detectValences(jobText, candText)

    const respostas = typeof c.respostas === 'object' && c.respostas !== null ? c.respostas : {}
    const updated = { ...respostas, __ats: { ...(respostas.__ats || {}), valences: result.matched, valenceScore: result.score, updatedAt: new Date().toISOString() } }

    const { error } = await supabase.from('candidaturas').update({ respostas: updated }).eq('id', c.id)
    if (error) {
      setToast({ message: 'Erro ao guardar valências', sub: error.message })
      return
    }
    setToast({ message: 'Valências detectadas', sub: `${result.matched.length} competências alinhadas` })
    onUpdate()
  }

  const moveStage = async (c: any, stage: ATSStage) => {
    const respostas = typeof c.respostas === 'object' && c.respostas !== null ? c.respostas : {}
    let status = c.status
    if (stage === 'rejeitado') status = 'rejeitada'
    if (stage === 'contratado') status = 'aprovada'
    const updated = { ...respostas, __ats: { ...(respostas.__ats || {}), stage, movedAt: new Date().toISOString() } }

    const update: any = { respostas: updated }
    if (status !== c.status) update.status = status

    const { error } = await supabase.from('candidaturas').update(update).eq('id', c.id)
    if (error) {
      setToast({ message: 'Erro ao mover candidato', sub: error.message })
      return
    }
    setToast({ message: `Movido para ${STAGE_LABELS[stage]}`, sub: c.users?.nome || 'Candidato' })
    onUpdate()
  }

  const runDraw = async () => {
    setDrawing(true)
    setDrawWinnersState(null)
    setTimeout(async () => {
      const vaga = selectedVaga !== 'all' ? vagas.find(v => v.id === selectedVaga) : undefined
      const pool = vaga ? candidatos.filter(c => c.vaga_id === vaga.id && getStage(c) === 'concorrencia') : candidatos.filter(c => getStage(c) === 'concorrencia')
      const winners = drawWinners(pool, drawCount, 0)
      setDrawWinnersState(winners)
      setDrawing(false)
      if (winners.length === 0) {
        setToast({ message: 'Nenhum candidato na fase de concorrência' })
        return
      }
      for (const w of winners) {
        await moveStage(w, 'pre_selecionados')
      }
      setToast({ message: `${winners.length} pré-selecionado(s) por sorteio`, sub: winners.map(w => w.users?.nome).join(', ') })
      setTimeout(() => setDrawOpen(false), 1500)
    }, 1200)
  }

  const exportCSV = () => {
    const rows = candidates.map(c => ({
      Nome: c.users?.nome || '',
      Email: c.users?.email || '',
      Vaga: c.vagas?.titulo || '',
      Estágio: STAGE_LABELS[getStage(c)],
      Score: scoreFor(c),
      Valências: (c.respostas?.__ats?.valences || []).join('; ')
    }))
    const csv = [Object.keys(rows[0] || {}).join(','), ...rows.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ats-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    setToast({ message: 'CSV exportado' })
  }

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} sub={toast.sub} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-5 text-white relative overflow-hidden shadow-lg">
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-3xl translate-y-6 -translate-x-6" />
        <div className="relative z-10 flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <BrainCircuit size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">ATS — Processo Seletivo</h2>
            <p className="text-xs text-white/70">Pipeline, valências e sorteio inteligente por vaga</p>
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap gap-2 mt-4">
          <select value={selectedVaga} onChange={e => setSelectedVaga(e.target.value)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none backdrop-blur-sm">
            <option value="all" className="text-slate-900">Todas as vagas</option>
            {filteredVagas.map(v => <option key={v.id} value={v.id} className="text-slate-900">{v.titulo}</option>)}
          </select>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value as any)} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none backdrop-blur-sm">
            <option value="all" className="text-slate-900">Todos os estágios</option>
            {STAGE_ORDER.map(s => <option key={s} value={s} className="text-slate-900">{STAGE_LABELS[s]}</option>)}
          </select>
          <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 flex-1 min-w-[140px]">
            <Search size={14} className="text-white/50" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar candidato..." className="bg-transparent outline-none text-xs text-white placeholder:text-white/50 flex-1" />
          </div>
          <button onClick={exportCSV} className="bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-xs font-medium flex items-center gap-1 transition-colors">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: candidates.length, icon: Users },
          { label: 'Em Triagem', value: candidatesByStage.triagem.length + candidatesByStage.recebida.length, icon: Filter },
          { label: 'Fase de Concorrência', value: candidatesByStage.concorrencia.length, icon: Trophy },
          { label: 'Pré-selecionados', value: candidatesByStage.pre_selecionados.length + candidatesByStage.contratado.length, icon: Star },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{s.label}</p>
              <s.icon size={14} className="text-cyan-500" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Draw CTA */}
      {candidatesByStage.concorrencia.length > 0 && (
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-4 text-white flex items-center justify-between shadow-md animate-pulse">
          <div className="flex items-center gap-3">
            <Trophy size={22} />
            <div>
              <p className="text-sm font-bold">Fase de Concorrência activa</p>
              <p className="text-[10px] text-white/90">{candidatesByStage.concorrencia.length} candidatos concorrem. Realizar sorteio?</p>
            </div>
          </div>
          <button onClick={() => setDrawOpen(true)} className="bg-white text-orange-600 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-orange-50 transition-colors">
            <Shuffle size={14} /> Sortear
          </button>
        </div>
      )}

      {/* Pipeline */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-[900px]">
          {STAGE_ORDER.map(stage => {
            const stageCands = candidatesByStage[stage] || []
            return (
              <div key={stage} className="flex-1 min-w-[220px] bg-slate-50/70 rounded-3xl border border-slate-100 p-3">
                <div className={`flex items-center justify-between rounded-2xl px-3 py-2 mb-3 border ${STAGE_COLORS[stage]}`}>
                  <span className="text-xs font-bold">{STAGE_LABELS[stage]}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/50 rounded-full">{stageCands.length}</span>
                </div>
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {stageCands.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">Vazio</p>}
                  {stageCands.map(c => {
                    const stage = getStage(c)
                    const valences = c.respostas?.__ats?.valences || []
                    const vScore = c.respostas?.__ats?.valenceScore || 0
                    const score = scoreFor(c)
                    const isExpanded = expanded === c.id
                    return (
                      <div key={c.id} className={`bg-white rounded-2xl p-3 border ${stage === 'concorrencia' ? 'border-amber-200 shadow-sm' : 'border-slate-100'} hover:shadow-md transition-all hover:-translate-y-0.5 group`}>
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">
                            <User size={16} strokeWidth={1.5} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{c.users?.nome || 'Candidato'}</p>
                            <p className="text-[10px] text-slate-500 truncate">{c.users?.email}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{c.vagas?.titulo}</p>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{score}% score</span>
                              {vScore > 0 && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-50 text-cyan-600 font-bold">{vScore}% match</span>}
                            </div>
                            {valences.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {valences.slice(0, 3).map((v: string, i: number) => (
                                  <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-600 border border-purple-100">{v}</span>
                                ))}
                                {valences.length > 3 && <span className="text-[9px] text-slate-400">+{valences.length - 3}</span>}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {stage !== 'rejeitado' && stage !== 'contratado' && (
                            <>
                              {stage !== 'pre_selecionados' && (
                                <button onClick={() => moveStage(c, STAGE_ORDER[STAGE_ORDER.indexOf(stage) + 1])} className="text-[9px] font-bold bg-slate-900 text-white px-2 py-1 rounded-lg flex items-center gap-0.5 hover:bg-slate-700 transition-colors">
                                  Avançar <ChevronRight size={10} />
                                </button>
                              )}
                              {stage === 'pre_selecionados' && (
                                <button onClick={() => moveStage(c, 'contratado')} className="text-[9px] font-bold bg-green-600 text-white px-2 py-1 rounded-lg flex items-center gap-0.5 hover:bg-green-700 transition-colors">
                                  <CheckCircle size={10} /> Contratar
                                </button>
                              )}
                              <button onClick={() => setExpanded(isExpanded ? null : c.id)} className="text-[9px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-1 rounded-lg flex items-center gap-0.5">
                                <Sparkles size={10} /> Valências
                              </button>
                              <button onClick={() => moveStage(c, 'rejeitado')} className="text-[9px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded-lg flex items-center gap-0.5 hover:bg-red-100 transition-colors">
                                <XCircle size={10} />
                              </button>
                            </>
                          )}
                          {(stage === 'rejeitado' || stage === 'contratado') && (
                            <button onClick={() => moveStage(c, 'recebida')} className="text-[9px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg flex items-center gap-0.5">
                              <ChevronLeft size={10} /> Reabrir
                            </button>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-700 mb-1 flex items-center gap-1"><Zap size={10} className="text-cyan-500" /> Detecção de valências</p>
                            {valences.length === 0 ? (
                              <button onClick={() => detectAndSave(c)} className="text-[10px] font-bold bg-cyan-500 text-white px-2 py-1 rounded-lg flex items-center gap-1">
                                <BrainCircuit size={10} /> Analisar candidato
                              </button>
                            ) : (
                              <div className="flex flex-wrap gap-1">
                                {valences.map((v: string, i: number) => (
                                  <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">{v}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Draw Modal */}
      {drawOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70" onClick={() => !drawing && setDrawOpen(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy size={28} className="text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Sorteio de Pré-seleção</h2>
            <p className="text-xs text-slate-500 mb-4">Seleccionar {drawCount} candidato(s) da fase de concorrência.</p>
            <input type="number" min={1} max={20} value={drawCount} onChange={e => setDrawCount(parseInt(e.target.value) || 1)} className="w-20 mx-auto border border-slate-200 rounded-xl px-3 py-2 text-sm text-center mb-4" />
            <button onClick={runDraw} disabled={drawing} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors disabled:opacity-50">
              {drawing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Shuffle size={16} />}
              {drawing ? 'A sortear...' : 'Realizar sorteio'}
            </button>
            {drawWinnersState && (
              <div className="mt-4 space-y-2">
                {drawWinnersState.map(w => (
                  <div key={w.id} className="bg-green-50 text-green-800 text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1">
                    <Award size={14} /> {w.users?.nome || 'Candidato'}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
