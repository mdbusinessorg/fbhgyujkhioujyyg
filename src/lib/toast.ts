export type ToastKind = 'success' | 'info' | 'error'

export function toast(message: string, kind: ToastKind = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('mosalo:ui-toast', { detail: { message, kind } }))
}
