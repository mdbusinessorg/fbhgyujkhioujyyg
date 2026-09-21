'use client'

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface StatChartCardProps {
  title: string
  value: string | number
  subtitle?: string
  data: { name: string; value: number }[]
  color?: string
  colors?: string[]
  onClick?: (name: string) => void
}

const defaultPalette = [
  '#3B82F6',
  '#6C47FF',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#8B5CF6',
  '#14B8A6',
  '#F97316',
]

export function StatChartCard({ title, value, subtitle, data, color, colors, onClick }: StatChartCardProps) {
  const barColors = colors || data.map((_, i) => defaultPalette[i % defaultPalette.length])

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {barColors.map((c, i) => (
                <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={c} />
                  <stop offset="100%" stopColor={c} stopOpacity={0.7} />
                </linearGradient>
              ))}
            </defs>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6B7280' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              cursor={{ fill: 'rgba(0,0,0,0.03)' }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={32}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={color || `url(#grad-${index % barColors.length})`}
                  stroke={barColors[index % barColors.length]}
                  strokeWidth={1}
                  onClick={() => onClick?.(entry.name)}
                  style={{ cursor: onClick ? 'pointer' : 'default' }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
