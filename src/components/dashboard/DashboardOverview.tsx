'use client'

import { useState, useEffect, useMemo } from 'react'
import { DashboardHeader } from './DashboardHeader'
import { StatChartCard } from './StatChartCard'
import { DonutCard } from './DonutCard'
import { LatestList } from './LatestList'
import { ProBanner } from './ProBanner'
import { PeriodFilter, type Period } from './PeriodFilter'
import { groupByPeriod, countInPeriod, countByField, countByStatus, formatDate } from './utils'

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

const periodLabel: Record<Period, string> = {
  day: 'Nos últimos 7 dias',
  month: 'Neste mês',
  year: 'Neste ano',
}

export function DashboardOverview({ role, data, onTabChange }: DashboardOverviewProps) {
  const [externalJobs, setExternalJobs] = useState<any[]>([])
  const [period, setPeriod] = useState<Period>('day')

  useEffect(() => {
    fetch('/external-jobs.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setExternalJobs(j.jobs || []))
      .catch(() => setExternalJobs([]))
  }, [])

  const content = useMemo(() => {
    const chartColors = ['#3B82F6', '#6C47FF', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#14B8A6', '#F97316']

    if (role === 'admin') {
      const d = data as AdminData
      const activeVagas = d.vagas.filter((v) => v.status === 'aberta')
      const usersChartData = countByField(d.users, 'role', 5)
      const vagasChartData = countByField(d.vagas, 'area', 5)
      const candidaturasData = groupByPeriod(d.candidaturas, 'data_candidatura', period)
      const vagasData = groupByPeriod(d.vagas, 'created_at', period)
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
            value: countInPeriod(d.candidaturas, 'data_candidatura', period),
            subtitle: periodLabel[period],
            data: candidaturasData,
            colors: chartColors,
            onClick: () => onTabChange('utilizadores'),
          },
          {
            title: 'Vagas publicadas',
            value: countInPeriod(d.vagas, 'created_at', period),
            subtitle: periodLabel[period],
            data: vagasData,
            colors: chartColors.slice(3),
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
      const candidaturasData = groupByPeriod(d.candidatos, 'data_candidatura', period)
      const vagasData = groupByPeriod(d.vagas, 'created_at', period)
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
            value: countInPeriod(d.candidatos, 'data_candidatura', period),
            subtitle: periodLabel[period],
            data: candidaturasData,
            colors: chartColors,
            onClick: () => onTabChange('candidatos'),
          },
          {
            title: 'Vagas activas',
            value: countInPeriod(d.vagas, 'created_at', period),
            subtitle: periodLabel[period],
            data: vagasData,
            colors: chartColors.slice(3),
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

    const d = data as CandidatoData
    const candidaturasData = groupByPeriod(d.candidaturas, 'data_candidatura', period)
    const statusData = countByStatus(d.candidaturas, ['enviada', 'aprovada', 'rejeitada'])
      .map((s) => ({ ...s, name: s.name === 'enviada' ? 'Pendente' : s.name === 'aprovada' ? 'Aceite' : 'Rejeitado' }))
      .filter((s) => s.value > 0)
    const recommendedData = groupByPeriod(externalJobs, 'first_seen_at', period)

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
          value: countInPeriod(d.candidaturas, 'data_candidatura', period),
          subtitle: periodLabel[period],
          data: candidaturasData,
          colors: chartColors,
          onClick: () => onTabChange('candidaturas'),
        },
        {
          title: 'Vagas recomendadas',
          value: countInPeriod(externalJobs, 'first_seen_at', period),
          subtitle: periodLabel[period],
          data: recommendedData,
          colors: chartColors.slice(3),
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
  }, [role, data, externalJobs, period, onTabChange])

  return (
    <div className="space-y-6">
      <DashboardHeader
        title={content.title}
        subtitle={content.subtitle}
        userName={content.userName}
        notifications={content.notifications}
        onNotificationsClick={() => onTabChange('home')}
      />

      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">Estatísticas</p>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

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
