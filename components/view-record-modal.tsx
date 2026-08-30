'use client'

import { Bell, Calendar, DollarSign, Hash, Pencil, Share2, X } from 'lucide-react'
import type { ServiceRecord } from '@/lib/types'
import { fullDateTime } from '@/lib/format'

interface ViewRecordModalProps {
  record: ServiceRecord | null
  onClose: () => void
  onEdit: (record: ServiceRecord) => void
  onShare: (record: ServiceRecord) => void
  onZoomPhoto: (photo: string) => void
}

export function ViewRecordModal({ record, onClose, onEdit, onShare, onZoomPhoto }: ViewRecordModalProps) {
  if (!record) return null

  const styledText: React.CSSProperties = {
    fontFamily: `'${record.textStyle.fontFamily}', sans-serif`,
    color: record.textStyle.color,
    fontSize: `${record.textStyle.fontSize}px`,
    fontWeight: record.textStyle.isBold ? 700 : 400,
    fontStyle: record.textStyle.isItalic ? 'italic' : 'normal',
    textDecoration: record.textStyle.isUnderline ? 'underline' : 'none',
  }

  return (
    <div className="fixed inset-0 z-[3500] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="animate-fade-up flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="truncate text-lg font-bold">{record.clientName || 'Cliente'}</h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>

        <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4">
          <div className="flex flex-wrap gap-1.5">
            {record.plate && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                <Hash className="size-3.5" /> {record.plate}
              </span>
            )}
            {record.price && (
              <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-sm font-bold text-white">
                <DollarSign className="size-3.5" /> {record.price}
              </span>
            )}
            {record.schedule && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                <Bell className="size-3.5" />
                {new Date(record.schedule + 'T00:00:00').toLocaleDateString('pt-BR')} {record.scheduleTime?.slice(0, 5)}
              </span>
            )}
          </div>

          {record.noteText && (
            <div className="whitespace-pre-wrap break-words rounded-lg border-l-[3px] border-primary bg-background p-3">
              <span style={styledText}>{record.noteText}</span>
            </div>
          )}

          {record.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {record.photos.map((p, i) => (
                <img
                  key={i}
                  src={p || '/placeholder.svg'}
                  alt={`Foto ${i + 1}`}
                  onClick={() => onZoomPhoto(p)}
                  className="aspect-square w-full cursor-pointer rounded-lg border border-border object-cover transition hover:border-primary"
                />
              ))}
            </div>
          )}

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5 text-primary" /> Criado em {fullDateTime(record.createdAt)}
          </p>
        </div>

        <div className="flex gap-2 border-t border-border p-3">
          <button
            onClick={() => onEdit(record)}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-3 font-semibold text-foreground"
          >
            <Pencil className="size-4" /> Editar
          </button>
          <button
            onClick={() => onShare(record)}
            className="flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-primary py-3 font-bold text-primary-foreground hover:bg-primary-dark"
          >
            <Share2 className="size-4" /> Compartilhar
          </button>
        </div>
      </div>
    </div>
  )
}
