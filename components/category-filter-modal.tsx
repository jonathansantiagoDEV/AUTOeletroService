'use client'

import { Check, LayoutGrid } from 'lucide-react'
import type { ServiceCategory } from '@/lib/types'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/types'

interface CategoryFilterModalProps {
  open: boolean
  value: ServiceCategory | 'todas'
  onClose: () => void
  onSelect: (value: ServiceCategory | 'todas') => void
}

export function CategoryFilterModal({ open, value, onClose, onSelect }: CategoryFilterModalProps) {
  if (!open) return null

  function pick(v: ServiceCategory | 'todas') {
    onSelect(v)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[5200] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-up w-full max-w-[400px] overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 bg-primary px-4 py-4 text-primary-foreground">
          <LayoutGrid className="size-5" />
          <h2 className="text-base font-bold">Filtrar por categoria</h2>
        </div>

        <div className="thin-scroll max-h-[60vh] space-y-1.5 overflow-y-auto p-3">
          <button
            onClick={() => pick('todas')}
            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left font-semibold transition ${
              value === 'todas'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background text-foreground hover:bg-border/30'
            }`}
          >
            Todas as categorias
            {value === 'todas' && <Check className="size-4" />}
          </button>
          {CATEGORY_ORDER.map((c) => (
            <button
              key={c}
              onClick={() => pick(c)}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left font-semibold transition ${
                value === c
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background text-foreground hover:bg-border/30'
              }`}
            >
              {CATEGORY_LABELS[c]}
              {value === c && <Check className="size-4" />}
            </button>
          ))}
        </div>

        <div className="p-3 pt-0">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-border bg-background py-2.5 font-semibold text-foreground transition hover:bg-border/40"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
