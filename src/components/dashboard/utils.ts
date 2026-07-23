export const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const monthLabels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

export type Period = 'day' | 'month' | 'year'

export function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}

export function groupByDay<T extends { created_at?: string; data_candidatura?: string; first_seen_at?: string }>(
  items: T[],
  field: keyof T = 'created_at'
): { name: string; value: number }[] {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const counts: number[] = new Array(7).fill(0)
  for (const item of items) {
    const raw = (item[field] as any) as string | undefined
    if (!raw) continue
    const d = new Date(raw)
    if (isNaN(d.getTime())) continue
    const diff = Math.floor((d.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24))
    if (diff >= 0 && diff < 7) {
      const dayIndex = d.getDay()
      counts[dayIndex]++
    }
  }
  const ordered = [...counts.slice(1), counts[0]]
  const labels = [...dayLabels.slice(1), dayLabels[0]]
  return labels.map((name, i) => ({ name, value: ordered[i] }))
}

function getKey(d: Date, period: Period): string {
  if (period === 'day') return d.toISOString().slice(0, 10)
  if (period === 'month') return `${d.getDate()}`
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function groupByPeriod<T extends { created_at?: string; data_candidatura?: string; first_seen_at?: string }>(
  items: T[],
  field: keyof T,
  period: Period
): { name: string; value: number }[] {
  const now = new Date()
  const data = new Map<string, { label: string; value: number }>()

  if (period === 'day') {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const key = d.toISOString().slice(0, 10)
      const label = dayLabels[d.getDay()]
      data.set(key, { label, value: 0 })
    }
  } else if (period === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const key = `${i}`
      data.set(key, { label: `${i}`, value: 0 })
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1)
      const key = `${now.getFullYear()}-${String(i + 1).padStart(2, '0')}`
      data.set(key, { label: monthLabels[i], value: 0 })
    }
  }

  for (const item of items) {
    const raw = (item[field] as any) as string | undefined
    if (!raw) continue
    const d = new Date(raw)
    if (isNaN(d.getTime())) continue
    const key = getKey(d, period)
    if (data.has(key)) {
      const entry = data.get(key)!
      entry.value++
    }
  }

  return Array.from(data.values()).map((entry) => ({ name: entry.label, value: entry.value }))
}

export function countInPeriod<T extends { created_at?: string; data_candidatura?: string; first_seen_at?: string }>(
  items: T[],
  field: keyof T,
  period: Period
): number {
  const now = new Date()
  return items.filter((item) => {
    const raw = (item[field] as any) as string | undefined
    if (!raw) return false
    const d = new Date(raw)
    if (isNaN(d.getTime())) return false
    if (period === 'day') {
      const limit = new Date(now)
      limit.setDate(limit.getDate() - 6)
      limit.setHours(0, 0, 0, 0)
      return d >= limit
    }
    if (period === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }
    return d.getFullYear() === now.getFullYear()
  }).length
}

export function countByStatus<T extends { status?: string }>(items: T[], statuses: string[]): { name: string; value: number; color: string }[] {
  const colors = ['#6C47FF', '#10B981', '#F59E0B', '#EF4444', '#3B82F6']
  return statuses.map((status, i) => ({
    name: status,
    value: items.filter((item) => (item.status || '').toLowerCase() === status.toLowerCase()).length,
    color: colors[i % colors.length],
  }))
}

export function countByField<T extends Record<string, any>>(items: T[], field: keyof T, topN = 5): { name: string; value: number; color: string }[] {
  const map = new Map<string, number>()
  for (const item of items) {
    const key = String(item[field] || 'Outro')
    map.set(key, (map.get(key) || 0) + 1)
  }
  const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, topN)
  const colors = ['#6C47FF', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#8B5CF6']
  return sorted.map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
}
