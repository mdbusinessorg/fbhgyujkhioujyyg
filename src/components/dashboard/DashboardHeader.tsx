'use client'

import { Search, Bell, User } from 'lucide-react'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  userName?: string
  notifications?: number
  onNotificationsClick?: () => void
}

export function DashboardHeader({ title, subtitle, userName, notifications = 0, onNotificationsClick }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-gray-100">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar..."
            className="bg-transparent outline-none text-sm text-gray-700 placeholder:text-gray-400 w-40"
          />
        </div>

        <button
          onClick={onNotificationsClick}
          className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 relative"
        >
          <Bell size={18} className="text-gray-600" />
          {notifications > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </button>

        <div className="flex items-center gap-2 pl-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ms-purple to-ms-blue flex items-center justify-center text-white">
            <User size={20} strokeWidth={1.5} />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-gray-900">{userName || 'Utilizador'}</p>
            <p className="text-[10px] text-gray-500">Online</p>
          </div>
        </div>
      </div>
    </div>
  )
}
