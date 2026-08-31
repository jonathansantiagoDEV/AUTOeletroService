'use client'

import { Bell, Clock, DollarSign, Hash, Image as ImageIcon, Pencil, Share2, Trash2, UserCircle } from 'lucide-react'
import type { ServiceRecord } from '@/lib/types'
import { timeAgo } from '@/lib/format'

interface RecordCardProps {
  record: ServiceRecord
  onView: (record: ServiceRecord) => void
  onEdit: (record: ServiceRecord) => void
  onDelete: (id: string) => void
  onShare: (record: ServiceRecord) => void
  onZoomPhoto: (photo: string) => void
}

export function RecordCard({ record, onView, onEdit, onDelete, onShare, onZoomPhoto }: RecordCardProps) {
  const maxShow = 4
  const shownPhotos = record.photos.slice(0, maxShow)
  const extra = record.photos.length - maxShow

  const styledText: React.CSSProperties = {
    fontFamily: `'${record.textStyle.fontFamily}', sans-serif`,
    color: record.textStyle.color,
    fontSize: `${record.textStyle.fontSize}px`,
    fontWeight: record.textStyle.isBold ? 700 : 400,
    fontStyle: record.textStyle.isItalic ? 'italic' : 'normal',
    textDecoration: record.textStyle.isUnderline ? 'underline' : 'none',
  }

  return (
    <div
      onClick={() => onView(record)}
      className={`animate-slide-in cursor-pointer rounded-app border bg-card p-4 shadow-[var(--shadow-app)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] ${
        record.schedule ? 'border-l-4 border-l-primary border-primary/40' : 'border-border'
      }`}
    >
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <div className="flex-1 break-words text-base font-bold text-foreground">
          <UserCircle className="mr-1.5 inline size-4 text-primary" />
          {record.clientName || 'Cliente'}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            aria-label="Editar"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(record)
            }}
            className="rounded-full p-2.5 text-muted-foreground transition hover:bg-background hover:text-primary"
          >
            <Pencil className="size-5" />
          </button>
          <button
            aria-label="Excluir"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(record.id)
            }}
            className="rounded-full p-2.5 text-muted-foreground transition hover:bg-background hover:text-danger"
          >
            <Trash2 className="size-5" />
          </button>
          <button
            aria-label="Compartilhar"
            onClick={(e) => {
              e.stopPropagation()
              onShare(record)
            }}
            className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground transition hover:bg-primary-dark"
          >
            <Share2 className="size-4" />
          </button>
        </div>
      </div>

      {(record.plate || record.price) && (
        <div className="my-1.5 flex flex-wrap gap-1.5">
          {record.plate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-sm font-bold text-primary-foreground">
              <Hash className="size-3.5" /> {record.plate}
            </span>
          )}
          {record.price && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-0.5 text-sm font-bold text-white">
              <DollarSign className="size-3.5" /> {record.price}
            </span>
          )}
        </div>
      )}

      {record.noteText && (
        <div className="my-1.5 max-h-[100px] overflow-hidden whitespace-pre-wrap break-words rounded-lg border-l-[3px] border-primary bg-background px-2.5 py-1.5">
          <span style={styledText}>{record.noteText}</span>
        </div>
      )}

      {record.photos.length === 1 && (
        <div className="my-2">
          <img
            src={record.photos[0] || '/placeholder.svg'}
            alt="Foto do serviço"
            onClick={(e) => {
              e.stopPropagation()
              onZoomPhoto(record.photos[0])
            }}
            className="aspect-video w-full cursor-pointer rounded-lg border border-border object-cover shadow-sm transition hover:opacity-90"
          />
        </div>
      )}

      {record.photos.length > 1 && (
        <div className="my-2 grid grid-cols-4 gap-1.5">
          {shownPhotos.map((photo, i) => (
            <img
              key={i}
              src={photo || '/placeholder.svg'}
              alt={`Foto ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation()
                onZoomPhoto(photo)
              }}
              className="aspect-square w-full cursor-pointer rounded-lg border border-border object-cover shadow-sm transition hover:scale-[1.03] hover:border-primary"
            />
          ))}
          {extra > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onView(record)
              }}
              className="flex aspect-square w-full cursor-pointer items-center justify-center rounded-lg bg-primary text-base font-bold text-primary-foreground transition hover:scale-[1.03] hover:bg-primary-dark"
            >
              +{extra}
            </div>
          )}
        </div>
      )}

      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border pt-1.5 text-sm text-muted-foreground">
        <span>
          <Clock className="mr-0.5 inline size-3.5 text-primary" /> {timeAgo(record.createdAt)}
        </span>
        {record.schedule && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-sm font-bold text-primary-foreground">
            <Bell className="size-3.5" /> {record.scheduleTime ? record.scheduleTime.slice(0, 5) : ''}
          </span>
        )}
        {record.photos.length > 0 && (
          <span>
            <ImageIcon className="mr-0.5 inline size-3.5 text-primary" /> {record.photos.length}
          </span>
        )}
      </div>
    </div>
  )
}