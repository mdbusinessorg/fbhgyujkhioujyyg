'use client'

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

interface DonutCardProps {
  title: string
  data: { name: string; value: number; color: string }[]
  totalLabel?: string
  onSliceClick?: (name: string) => void
}

export function DonutCard({ title, data, totalLabel, onSliceClick }: DonutCardProps) {
  const total = data.reduce((acc, d) => acc + d.value, 0)
  const activeData = data.filter((d) => d.value > 0)

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-40 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={activeData}
              dataKey="value"
              nameKey="name"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={2}
              stroke="none"
              onClick={(d) => onSliceClick?.((d as any).name as string)}
            >
              {activeData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{ cursor: onSliceClick ? 'pointer' : 'default' }}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xl font-bold text-gray-900">{total}</p>
            {totalLabel && <p className="text-[10px] text-gray-500">{totalLabel}</p>}
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {activeData.map((d) => (
          <div key={d.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
              <span className="text-gray-600">{d.name}</span>
            </div>
            <span className="font-semibold text-gray-800">{Math.round((d.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
