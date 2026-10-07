'use client'

import { X, RotateCcw } from 'lucide-react'

interface ChipGroupProps {
  title: string
  options: string[]
  value: string
  allLabel: string
  onChange: (v: string) => void
}

function ChipGroup({ title, options, value, allLabel, onChange }: ChipGroupProps) {
  return (
    <div>
      <p className="text-xs font-bold text-ms-dark mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {[allLabel, ...options].map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`chip-toggle text-xs font-medium px-3.5 py-2 rounded-full border ${value === o ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )
}

interface FilterSheetProps {
  open: boolean
  onClose: () => void
  resultCount: number
  locations: string[]
  contract: string
  setContract: (v: string) => void
  modality: string
  setModality: (v: string) => void
  location: string
  setLocation: (v: string) => void
  onlyToday: boolean
  setOnlyToday: (v: boolean) => void
  hideOld: boolean
  setHideOld: (v: boolean) => void
  onlyApply: boolean
  setOnlyApply: (v: boolean) => void
  onlySalary: boolean
  setOnlySalary: (v: boolean) => void
  contracts: string[]
  modalities: string[]
  onClear: () => void
}

export default function FilterSheet({
  open,
  onClose,
  resultCount,
  locations,
  contract,
  setContract,
  modality,
  setModality,
  location,
  setLocation,
  onlyToday,
  setOnlyToday,
  hideOld,
  setHideOld,
  onlyApply,
  setOnlyApply,
  onlySalary,
  setOnlySalary,
  contracts,
  modalities,
  onClear,
}: FilterSheetProps) {
  if (!open) return null

  return (
    <div className="lg:hidden fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40 backdrop-in" onClick={onClose} />
      <div className="sheet-up absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[85vh] flex flex-col shadow-2xl">
        <div className="pt-2 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-ms-border" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 border-b border-ms-border/60">
          <h2 className="text-base font-bold text-ms-dark">Filtrar vagas</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ms-surface flex items-center justify-center text-ms-gray" aria-label="Fechar filtros">
            <X size={16} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5 flex-1">
          <ChipGroup title="Localização" allLabel="Todas" options={locations} value={location} onChange={setLocation} />
          <ChipGroup title="Tipo de contrato" allLabel="Todos" options={contracts.filter(c => c !== 'Todos')} value={contract} onChange={setContract} />
          <ChipGroup title="Modalidade" allLabel="Todas" options={modalities.filter(m => m !== 'Todas')} value={modality} onChange={setModality} />

          <div>
            <p className="text-xs font-bold text-ms-dark mb-2">Extras</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Só de hoje', value: onlyToday, set: setOnlyToday },
                { label: 'Sem vagas +3 semanas', value: hideOld, set: setHideOld },
                { label: 'Candidatura directa', value: onlyApply, set: setOnlyApply },
                { label: 'Com salário', value: onlySalary, set: setOnlySalary },
              ].map((t) => (
                <button
                  key={t.label}
                  onClick={() => t.set(!t.value)}
                  className={`chip-toggle text-xs font-medium px-3.5 py-2 rounded-full border ${t.value ? 'bg-ms-blue text-white border-ms-blue' : 'bg-white text-ms-gray border-ms-border'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-ms-border/60 safe-area-pb">
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-1.5 border border-ms-border text-ms-dark text-sm font-semibold px-4 py-3 rounded-full press"
          >
            <RotateCcw size={14} /> Limpar
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-ms-blue text-white text-sm font-bold py-3 rounded-full press"
          >
            Ver {resultCount} {resultCount === 1 ? 'vaga' : 'vagas'}
          </button>
        </div>
      </div>
    </div>
  )
}
