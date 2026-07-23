'use client'

export type Period = 'day' | 'month' | 'year'

interface PeriodFilterProps {
  value: Period
  onChange: (period: Period) => void
}

const options: { key: Period; label: string }[] = [
  { key: 'day', label: 'Dia' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
]

export function PeriodFilter({ value, onChange }: PeriodFilterProps) {
  return (
    <div className="inline-flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
      {options.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(opt.key)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
            value === opt.key
              ? 'bg-ms-purple text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
