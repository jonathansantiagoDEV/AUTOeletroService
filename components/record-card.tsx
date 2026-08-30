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
      className={`animate-slide-in cursor-pointer rounded-app border bg-card p-3.5 shadow-[var(--shadow-app)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] ${
        record.schedule ? 'border-l-4 border-l-primary border-primary/40' : 'border-border'
      }`}
    >
      <div className="mb-0.5 flex items-start justify-between gap-1.5">
        <div className="flex-1 break-words text-base font-bold text-foreground">
          <UserCircle className="mr-1.5 inline size-4 text-primary" />
          {record.clientName || 'Cliente'}
        </div>
        <div className="flex shrink-0 gap-0.5">
          <button
            aria-label="Editar"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(record)
            }}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-primary"
          >
            <Pencil className="size-4" />
          </button>
          <button
            aria-label="Excluir"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(record.id)
            }}
            className="rounded-full p-1.5 text-muted-foreground transition hover:bg-background hover:text-danger"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            aria-label="Compartilhar"
            onClick={(e) => {
              e.stopPropagation()
              onShare(record)
            }}
            className="flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-bold text-primary-foreground transition hover:bg-primary-dark"
          >
            <Share2 className="size-3" />
          </button>
        </div>
      </div>

      {(record.plate || record.price) && (
        <div className="my-1 flex flex-wrap gap-1">
          {record.plate && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-px text-sm font-bold text-primary-foreground">
              <Hash className="size-3" /> {record.plate}
            </span>
          )}
          {record.price && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-px text-sm font-bold text-white">
              <DollarSign className="size-3" /> {record.price}
            </span>
          )}
        </div>
      )}

      {record.noteText && (
        <div className="my-1 max-h-[100px] overflow-hidden whitespace-pre-wrap break-words rounded-lg border-l-[3px] border-primary bg-background px-2.5 py-1.5">
          <span style={styledText}>{record.noteText}</span>
        </div>
      )}

      {record.photos.length > 0 && (
        <div className="my-1 flex flex-wrap gap-1.5">
          {shownPhotos.map((photo, i) => (
            <img
              key={i}
              src={photo || '/placeholder.svg'}
              alt={`Foto ${i + 1}`}
              onClick={(e) => {
                e.stopPropagation()
                onZoomPhoto(photo)
              }}
              className="size-[60px] cursor-pointer rounded-lg border-2 border-border object-cover transition hover:scale-105 hover:border-primary"
            />
          ))}
          {extra > 0 && (
            <div
              onClick={(e) => {
                e.stopPropagation()
                onView(record)
              }}
              className="flex size-[60px] cursor-pointer items-center justify-center rounded-lg bg-primary text-lg font-bold text-primary-foreground transition hover:scale-105 hover:bg-primary-dark"
            >
              +{extra}
            </div>
          )}
        </div>
      )}

      <div className="mt-0.5 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 border-t border-border pt-1.5 text-sm text-muted-foreground">
        <span>
          <Clock className="mr-0.5 inline size-3.5 text-primary" /> {timeAgo(record.createdAt)}
        </span>
        {record.schedule && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-px text-sm font-bold text-primary-foreground">
            <Bell className="size-3" /> {record.scheduleTime ? record.scheduleTime.slice(0, 5) : ''}
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
