export const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function groupByDay<T extends { created_at?: string; data_candidatura?: string; first_seen_at?: string }>(
  items: T[],
  field: keyof T = 'created_at'
): { name: string; value: number }[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

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

  const ordered = [...counts.slice(1), counts[0]] // Seg, Ter, ..., Sex, Sáb, Dom
  const labels = [...dayLabels.slice(1), dayLabels[0]]
  return labels.map((name, i) => ({ name, value: ordered[i] }))
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

export function formatDate(dateStr?: string) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })
}
