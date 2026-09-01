'use client'

import { Calendar, DollarSign, Hash, History, X } from 'lucide-react'
import type { ServiceRecord } from '@/lib/types'
import { STATUS_COLORS, STATUS_LABELS } from '@/lib/types'
import { fullDateTime } from '@/lib/format'

interface ClientHistoryModalProps {
  open: boolean
  current: ServiceRecord | null
  records: ServiceRecord[]
  onClose: () => void
  onSelect: (record: ServiceRecord) => void
}

export function ClientHistoryModal({ open, current, records, onClose, onSelect }: ClientHistoryModalProps) {
  if (!open || !current) return null

  // Agrupa por placa (mais confiável) ou, na falta dela, pelo nome do cliente
  const history = records
    .filter((r) => {
      if (r.id === current.id) return false
      if (current.plate) return r.plate === current.plate
      return !!current.clientName && r.clientName.trim().toLowerCase() === current.clientName.trim().toLowerCase()
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const label = current.plate ? `placa ${current.plate}` : current.clientName || 'este cliente'

  return (
    <div className="fixed inset-0 z-[4200] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="animate-fade-up flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="flex items-center gap-1.5 truncate text-base font-bold">
            <History className="size-4.5" /> Histórico — {label}
          </h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>

        <div className="thin-scroll flex-1 space-y-2 overflow-y-auto p-4">
          {history.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum outro serviço encontrado para {label}.
            </p>
          ) : (
            history.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelect(r)}
                className="flex w-full flex-col gap-1 rounded-lg border border-border bg-background p-3 text-left transition hover:border-primary"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3.5 text-primary" /> {fullDateTime(r.createdAt)}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
                    style={{ backgroundColor: STATUS_COLORS[r.status ?? 'em_andamento'] }}
                  >
                    {STATUS_LABELS[r.status ?? 'em_andamento']}
                  </span>
                </div>
                <p className="truncate text-sm font-semibold text-foreground">{r.noteText || 'Sem descrição'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.plate && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      <Hash className="size-3" /> {r.plate}
                    </span>
                  )}
                  {r.price && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success">
                      <DollarSign className="size-3" /> {r.price}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
