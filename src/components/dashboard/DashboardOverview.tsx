'use client'

import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Users, Briefcase, FileText, UserCheck, AlertTriangle } from 'lucide-react'
import { DashboardHeader } from './DashboardHeader'
import { StatChartCard } from './StatChartCard'
import { DonutCard } from './DonutCard'
import { LatestList } from './LatestList'
import { ProBanner } from './ProBanner'
import { groupByDay, countByField, countByStatus, formatDate } from './utils'

export interface AdminData {
  users: any[]
  vagas: any[]
  candidaturas: any[]
  subscriptions: any[]
  paymentRequests: any[]
  externalJobs: any[]
  linkedinJobs: any[]
  quickJobs: any[]
  pendentes: any[]
  vagasPendentes: any[]
}

export interface RecrutadorData {
  vagas: any[]
  candidatos: any[]
  userName: string
  aprovado: boolean
  daysRemaining: number | null
  subPlano: string
}

export interface CandidatoData {
  candidaturas: any[]
  userName: string
  daysRemaining: number | null
  subPlano: string
  cvScore: number
}

interface DashboardOverviewProps {
  role: 'admin' | 'recrutador' | 'candidato'
  data: AdminData | RecrutadorData | CandidatoData
  onTabChange: (tab: string) => void
}

export function DashboardOverview({ role, data, onTabChange }: DashboardOverviewProps) {
  const [externalJobs, setExternalJobs] = useState<any[]>([])

  useEffect(() => {
    fetch('/external-jobs.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setExternalJobs(j.jobs || []))
      .catch(() => setExternalJobs([]))
  }, [])

  const content = useMemo(() => {
    if (role === 'admin') {
      const d = data as AdminData
      const activeVagas = d.vagas.filter((v) => v.status === 'aberta')
      const usersChartData = countByField(d.users, 'role', 5)
      const vagasChartData = countByField(d.vagas, 'area', 5)
      const candidaturasByDay = groupByDay(d.candidaturas, 'data_candidatura')
      const vagasByDay = groupByDay(d.vagas, 'created_at')
      const statusData = [
        { name: 'Abertas', value: activeVagas.length, color: '#10B981' },
        { name: 'Em análise', value: d.vagasPendentes.length, color: '#F59E0B' },
        { name: 'Outras', value: d.vagas.length - activeVagas.length - d.vagasPendentes.length, color: '#6B7280' },
      ].filter((s) => s.value > 0)

      const latestItems = [
        ...(d.pendentes.length > 0
          ? d.pendentes.slice(0, 3).map((u: any) => ({
              id: u.id,
              icon: 'user' as const,
              title: u.nome || u.email,
              subtitle: 'Recrutador pendente',
              meta: 'Aprovar',
              action: () => onTabChange('recrutadores'),
            }))
          : []),
        ...(d.vagasPendentes.length > 0
          ? d.vagasPendentes.slice(0, 3).map((v: any) => ({
              id: v.id,
              icon: 'briefcase' as const,
              title: v.titulo,
              subtitle: 'Vaga pendente',
              meta: 'Revisar',
              action: () => onTabChange('vagas'),
            }))
          : []),
        ...d.candidaturas
          .slice(0, 5)
          .map((c: any) => ({
            id: c.id,
            icon: 'file' as const,
            title: c.vagas?.titulo || 'Vaga',
            subtitle: c.users?.nome || c.candidato_id || 'Candidato',
            meta: formatDate(c.data_candidatura),
          })),
      ]

      return {
        title: 'Visão Geral',
        subtitle: 'Painel de Administração',
        userName: 'Admin',
        notifications: d.pendentes.length + d.vagasPendentes.length,
        chartCards: [
          {
            title: 'Candidaturas recebidas',
            value: d.candidaturas.length,
            subtitle: 'Nesta semana',
            data: candidaturasByDay,
            color: '#3B82F6',
            onClick: () => onTabChange('utilizadores'),
          },
          {
            title: 'Vagas publicadas',
            value: activeVagas.length,
            subtitle: 'Activas no momento',
            data: vagasByDay,
            color: '#6C47FF',
            onClick: () => onTabChange('vagas'),
          },
        ],
        donutData: usersChartData.length > 0 ? usersChartData : vagasChartData,
        donutTitle: 'Utilizadores por tipo',
        donutTotalLabel: 'total',
        latestTitle: 'Actividade recente',
        latestItems,
        proDays: null,
      }
    }

    if (role === 'recrutador') {
      const d = data as RecrutadorData
      const activeVagas = d.vagas.filter((v) => v.status === 'aberta')
      const candidaturasByDay = groupByDay(d.candidatos, 'data_candidatura')
      const vagasByDay = groupByDay(d.vagas, 'created_at')
      const statusData = countByStatus(d.candidatos, ['enviada', 'aprovada', 'rejeitada'])
        .map((s) => ({ ...s, name: s.name === 'enviada' ? 'Pendente' : s.name === 'aprovada' ? 'Aceite' : 'Rejeitado' }))
        .filter((s) => s.value > 0)

      const latestItems = d.candidatos.slice(0, 5).map((c: any) => ({
        id: c.id,
        icon: 'user' as const,
        title: c.users?.nome || 'Candidato',
        subtitle: c.vagas?.titulo || 'Vaga',
        meta: c.status === 'aprovada' ? 'Aceite' : c.status === 'rejeitada' ? 'Rejeitado' : 'Pendente',
        action: () => onTabChange('candidatos'),
      }))

      return {
        title: 'Visão Geral',
        subtitle: `Bem-vindo, ${d.userName}`,
        userName: d.userName,
        notifications: d.candidatos.filter((c) => c.status === 'enviada').length,
        chartCards: [
          {
            title: 'Candidaturas recebidas',
            value: d.candidatos.length,
            subtitle: 'Total dos candidatos',
            data: candidaturasByDay,
            color: '#3B82F6',
            onClick: () => onTabChange('candidatos'),
          },
          {
            title: 'Vagas activas',
            value: activeVagas.length,
            subtitle: 'Publicadas por ti',
            data: vagasByDay,
            color: '#6C47FF',
            onClick: () => onTabChange('vagas'),
          },
        ],
        donutData: statusData,
        donutTitle: 'Candidaturas por estado',
        donutTotalLabel: 'total',
        latestTitle: 'Candidatos recentes',
        latestItems,
        proDays: d.daysRemaining,
      }
    }

    // candidato
    const d = data as CandidatoData
    const candidaturasByDay = groupByDay(d.candidaturas, 'data_candidatura')
    const statusData = countByStatus(d.candidaturas, ['enviada', 'aprovada', 'rejeitada'])
      .map((s) => ({ ...s, name: s.name === 'enviada' ? 'Pendente' : s.name === 'aprovada' ? 'Aceite' : 'Rejeitado' }))
      .filter((s) => s.value > 0)
    const recommendedByDay = groupByDay(externalJobs, 'first_seen_at')

    const latestItems = d.candidaturas.slice(0, 5).map((c: any) => ({
      id: c.id,
      icon: 'briefcase' as const,
      title: c.vagas?.titulo || 'Vaga',
      subtitle: c.vagas?.empresa_nome || 'Empresa',
      meta: c.status === 'aprovada' ? 'Aceite' : c.status === 'rejeitada' ? 'Rejeitado' : 'Pendente',
      action: () => onTabChange('candidaturas'),
    }))

    return {
      title: 'Visão Geral',
      subtitle: `Bem-vindo, ${d.userName}`,
      userName: d.userName,
      notifications: d.candidaturas.filter((c) => c.status === 'aprovada').length,
      chartCards: [
        {
          title: 'Candidaturas enviadas',
          value: d.candidaturas.length,
          subtitle: 'Nesta semana',
          data: candidaturasByDay,
          color: '#3B82F6',
          onClick: () => onTabChange('candidaturas'),
        },
        {
          title: 'Vagas recomendadas',
          value: externalJobs.length,
          subtitle: 'Actualizadas esta semana',
          data: recommendedByDay,
          color: '#10B981',
          onClick: () => onTabChange('candidaturas'),
        },
      ],
      donutData: statusData,
      donutTitle: 'Candidaturas por estado',
      donutTotalLabel: 'total',
      latestTitle: 'Candidaturas recentes',
      latestItems,
      proDays: d.daysRemaining,
    }
  }, [role, data, externalJobs, onTabChange])

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={content.title}
        subtitle={content.subtitle}
        userName={content.userName}
        notifications={content.notifications}
        onNotificationsClick={() => onTabChange('home')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {content.chartCards.map((card, i) => (
          <StatChartCard key={i} {...card} />
        ))}
      </div>

      {role !== 'admin' && (
        <ProBanner
          role={role}
          daysRemaining={content.proDays}
          onClick={() => onTabChange(role === 'candidato' ? 'subscricao' : 'nova_vaga')}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <DonutCard
            title={content.donutTitle}
            data={content.donutData}
            totalLabel={content.donutTotalLabel}
            onSliceClick={(name) => onTabChange(role === 'admin' ? 'utilizadores' : 'candidaturas')}
          />
        </div>
        <div className="lg:col-span-2">
          <LatestList
            title={content.latestTitle}
            items={content.latestItems}
            onSeeAll={() => onTabChange(role === 'admin' ? 'utilizadores' : 'candidaturas')}
          />
        </div>
      </div>
    </div>
  )
}
