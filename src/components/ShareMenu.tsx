'use client'

import { useState, useRef, useEffect } from 'react'
import { Share2, Link2, MessageCircle, Linkedin, Facebook, Twitter } from 'lucide-react'

interface ShareMenuProps {
  url: string
  title?: string
  text?: string
  size?: number
  className?: string
}

export default function ShareMenu({ url, title = 'MÔ SALO', text = 'Veja no MÔ SALO', size = 18, className = '' }: ShareMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const fullText = `${text} ${url}`

  const handleNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        setOpen(false)
        return
      } catch {}
    }
    setOpen(v => !v)
  }

  const options = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      href: `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`,
      color: 'text-green-600',
    },
    {
      name: 'LinkedIn',
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'text-blue-700',
    },
    {
      name: 'Facebook',
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'text-blue-600',
    },
    {
      name: 'X / Twitter',
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      color: 'text-slate-800',
    },
  ]

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      alert('Link copiado!')
    } catch {}
    setOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button onClick={handleNative} className="flex items-center gap-1.5 text-xs font-medium text-ms-gray hover:text-ms-dark transition-colors">
        <Share2 size={size} /> Partilhar
      </button>
      {open && (
        <div className="absolute bottom-8 right-0 bg-white rounded-xl shadow-xl border border-ms-border p-2 z-50 w-44">
          {options.map(opt => (
            <a
              key={opt.name}
              href={opt.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ms-surface text-sm text-ms-dark"
            >
              <opt.icon size={16} className={opt.color} /> {opt.name}
            </a>
          ))}
          <button onClick={copy} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-ms-surface text-sm text-ms-dark">
            <Link2 size={16} /> Copiar link
          </button>
        </div>
      )}
    </div>
  )
}
