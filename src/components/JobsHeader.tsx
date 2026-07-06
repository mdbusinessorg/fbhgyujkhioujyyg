'use client'

import { Bell, Search, SlidersHorizontal } from 'lucide-react'

type Category = {
  key: string
  label: string
}

interface JobsHeaderProps {
  userName: string
  searchQuery: string
  onSearchChange: (value: string) => void
  activeCategory: string
  onCategoryChange: (value: string) => void
  categories: readonly Category[]
  onBellClick?: () => void
  onFilterClick?: () => void
  searchPlaceholder?: string
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'MS'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function JobsHeader({
  userName,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  categories,
  onBellClick,
  onFilterClick,
  searchPlaceholder = 'Pesquisar vagas…',
}: JobsHeaderProps) {
  const initials = getInitials(userName || 'MÔ SALO')

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ms-blue/10">
            <span className="text-sm font-semibold text-ms-blue">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-xs text-ms-gray">Bem-vindo,</p>
            <h1 className="truncate text-lg font-bold text-ms-dark">{userName || 'Utilizador'}</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onBellClick}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-ms-surface text-ms-dark"
          aria-label="Notificações"
        >
          <Bell size={18} />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-ms-border bg-white px-4 py-3 shadow-sm focus-within:border-ms-blue">
          <Search size={18} className="flex-shrink-0 text-ms-gray" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-ms-dark outline-none placeholder:text-ms-gray"
          />
        </div>
        <button
          type="button"
          onClick={onFilterClick}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ms-blue text-white shadow-sm"
          aria-label="Filtrar"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((category) => {
          const isActive = activeCategory === category.key
          return (
            <button
              key={category.key}
              type="button"
              onClick={() => onCategoryChange(category.key)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'border-ms-blue bg-ms-blue text-white'
                  : 'border-ms-border bg-white text-ms-gray'
              }`}
            >
              {category.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
