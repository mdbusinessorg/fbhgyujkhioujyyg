export function timeAgo(date?: string | null | Date): string {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return 'agora'
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `há ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `há ${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `há ${months}m`
  return `há ${Math.floor(months / 12)}a`
}
