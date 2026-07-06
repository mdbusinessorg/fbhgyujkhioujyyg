import { SUPABASE_URL, STORAGE_BUCKET } from '@/lib/supabase'

export function avatarUrl(userId: string, cacheBuster?: string | number) {
  const base = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/${encodeURIComponent(userId)}/avatar`
  return cacheBuster ? `${base}?t=${cacheBuster}` : base
}
