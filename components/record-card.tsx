'use client'

import React, { useState, useRef } from 'react'
import { Bell, Clock, DollarSign, Hash, Image as ImageIcon, MessageCircle, Pencil, Phone, Share2, ShieldAlert, ShieldCheck, Trash2, UserCircle } from 'lucide-react'
import type { ServiceRecord } from '@/lib/types'
import { CATEGORY_LABELS, DEFAULT_TEXT_STYLE, STATUS_COLORS, STATUS_LABELS, isWarrantyExpired, isWarrantyExpiringSoon, warrantyDaysRemaining } from '@/lib/types'
import { timeAgo } from '@/lib/format'

interface RecordCardProps {
  record: ServiceRecord
  onView: (record: ServiceRecord) => void
  onEdit: (record: ServiceRecord) => void
  onDelete: (id: string) => void
  onShare: (record: ServiceRecord) => void
  onZoomPhoto: (photo: string) => void
  alerting?: boolean
}

export function RecordCard({ record, onView, onEdit, onDelete, onShare, onZoomPhoto, alerting }: RecordCardProps) {
  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const carouselRef = useRef<HTMLDivElement>(null)

  const handleScroll = () => {
    if (!carouselRef.current) return
    const { scrollLeft, clientWidth } = carouselRef.current
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / clientWidth)
      setActivePhotoIndex(index)
    }
  }

  const usingDefaultColor = record.textStyle.color === DEFAULT_TEXT_STYLE.color
  const warrantyExpired = isWarrantyExpired(record)
  const warrantyExpiringSoon = !warrantyExpired && isWarrantyExpiringSoon(record)
  const warrantyDays = warrantyDaysRemaining(record)
  const styledText: React.CSSProperties = {
    fontFamily: `'${record.textStyle.fontFamily}', sans-serif`,
    color: usingDefaultColor ? undefined : record.textStyle.color,
    fontSize: `${record.textStyle.fontSize}px`,
    fontWeight: record.textStyle.isBold ? 700 : 400,
    fontStyle: record.textStyle.isItalic ? 'italic' : 'normal',
    textDecoration: record.textStyle.isUnderline ? 'underline' : 'none',
  }

  return (
    <div
      onClick={() => onView(record)}
      className={`animate-slide-in cursor-pointer rounded-app border bg-card p-4 shadow-[var(--shadow-app)] transition-all hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] ${
        alerting
          ? 'animate-alert-blink border-2 border-danger'
          : record.schedule
            ? 'border-l-4 border-l-primary border-primary/40'
            : 'border-border'
      }`}
    >
      {alerting && (
        <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-danger px-2.5 py-1.5 text-xs font-bold text-white">
          <Bell className="size-3.5 animate-pulse-dot" /> Chegou a hora do agendamento!
        </div>
      )}
      <div className="mb-1.5 flex items-start justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-1.5 break-words text-base font-bold text-foreground">
          <UserCircle className="inline size-4 text-primary" />
          {record.clientName || 'Cliente'}
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
            style={{ backgroundColor: STATUS_COLORS[record.status ?? 'em_andamento'] }}
          >
            {STATUS_LABELS[record.status ?? 'em_andamento']}
          </span>
          {record.category && (
            <span className="rounded-full border border-primary/40 px-2 py-0.5 text-[10px] font-bold text-primary">
              {CATEGORY_LABELS[record.category]}
            </span>
          )}
        </div>
        <div className="flex shrink-0 gap-2">
          {record.clientPhone && (
            <>
              <a
                href={`tel:${record.clientPhone.replace(/\D/g, '')}`}
                onClick={(e) => e.stopPropagation()}
                aria-label="Ligar para o cliente"
                className="flex items-center justify-center rounded-full p-2.5 text-muted-foreground transition hover:bg-background hover:text-primary"
              >
                <Phone className="size-5" />
              </a>
              <a
                href={`https://wa.me/55${record.clientPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label="Chamar no WhatsApp"
                className="flex items-center justify-center rounded-full p-2.5 text-muted-foreground transition hover:bg-background hover:text-[#25D366]"
              >
                <MessageCircle className="size-5" />
              </a>
            </>
          )}
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
          <span style={styledText} className={usingDefaultColor ? 'text-foreground' : ''}>
            {record.noteText}
          </span>
        </div>
      )}

      {/* Carrossel Estilo Instagram - Forçando 100% da largura por item */}
      {record.photos && record.photos.length > 0 && (
        <div className="relative my-3 w-full overflow-hidden rounded-xl">
          <div
            ref={carouselRef}
            onScroll={handleScroll}
            className="flex w-full snap-x snap-mandatory overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {record.photos.map((photo, i) => (
              <div
                key={i}
                className="w-full min-w-full flex-shrink-0 snap-center"
              >
                <img
                  src={photo || '/placeholder.svg'}
                  alt={`Foto ${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onZoomPhoto(photo)
                  }}
                  className="aspect-square w-full cursor-pointer rounded-xl border border-border object-cover shadow-sm transition hover:opacity-95"
                />
              </div>
            ))}
          </div>

          {/* Tag de Contagem no Canto Superior */}
          {record.photos.length > 1 && (
            <div className="absolute right-3 top-3 rounded-full bg-black/75 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-sm pointer-events-none">
              {activePhotoIndex + 1}/{record.photos.length}
            </div>
          )}

          {/* Indicadores estilo Instagram */}
          {record.photos.length > 1 && (
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {record.photos.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activePhotoIndex === idx
                      ? 'w-4 bg-primary'
                      : 'w-1.5 bg-muted-foreground/40'
                  }`}
                />
              ))}
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
        {(warrantyExpired || warrantyExpiringSoon) && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-sm font-bold text-white ${
              warrantyExpired ? 'bg-danger' : 'bg-orange-500'
            }`}
          >
            {warrantyExpired ? (
              <>
                <ShieldAlert className="size-3.5" /> Garantia vencida
              </>
            ) : (
              <>
                <ShieldCheck className="size-3.5" />
                Garantia vence {warrantyDays === 0 ? 'hoje' : `em ${warrantyDays}d`}
              </>
            )}
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