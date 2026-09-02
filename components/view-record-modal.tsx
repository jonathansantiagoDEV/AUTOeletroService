'use client'

import { Bell, Calendar, DollarSign, Hash, History, Pencil, Share2, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import type { DateFormat, ServiceRecord } from '@/lib/types'
import { CATEGORY_LABELS, DEFAULT_TEXT_STYLE, formatDateStr, isWarrantyExpired, isWarrantyExpiringSoon, warrantyDaysRemaining } from '@/lib/types'

interface ViewRecordModalProps {
  record: ServiceRecord | null
  onClose: () => void
  onEdit: (record: ServiceRecord) => void
  onShare: (record: ServiceRecord) => void
  onZoomPhoto: (photos: string[], index: number) => void
  onShowHistory?: (record: ServiceRecord) => void
  dateFormat?: DateFormat
}

export function ViewRecordModal({ record, onClose, onEdit, onShare, onZoomPhoto, onShowHistory, dateFormat = 'dd/mm/yyyy' }: ViewRecordModalProps) {
  if (!record) return null

  const warrantyExpired = isWarrantyExpired(record)
  const warrantyExpiringSoon = !warrantyExpired && isWarrantyExpiringSoon(record)
  const warrantyDays = warrantyDaysRemaining(record)

  // Cor padrão (não escolhida manualmente pelo usuário) segue o tema
  // claro/escuro em vez de ficar travada em cinza-escuro (#1A1A1A).
  const usingDefaultColor = record.textStyle.color === DEFAULT_TEXT_STYLE.color
  const styledText: React.CSSProperties = {
    fontFamily: `'${record.textStyle.fontFamily}', sans-serif`,
    color: usingDefaultColor ? undefined : record.textStyle.color,
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
                {formatDateStr(record.schedule, dateFormat)} {record.scheduleTime?.slice(0, 5)}
              </span>
            )}
            {record.category && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/40 px-3 py-1 text-sm font-bold text-primary">
                {CATEGORY_LABELS[record.category]}
              </span>
            )}
            {(warrantyExpired || warrantyExpiringSoon) && (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-white ${
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
          </div>

          {record.noteText && (
            <div className="whitespace-pre-wrap break-words rounded-lg border-l-[3px] border-primary bg-background p-3">
              <span style={styledText} className={usingDefaultColor ? 'text-foreground' : ''}>
                {record.noteText}
              </span>
            </div>
          )}

          {record.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {record.photos.map((p, i) => (
                <img
                  key={i}
                  src={p || '/placeholder.svg'}
                  alt={`Foto ${i + 1}`}
                  onClick={() => onZoomPhoto(record.photos, i)}
                  className="aspect-square w-full cursor-pointer rounded-lg border border-border object-cover transition hover:border-primary"
                />
              ))}
            </div>
          )}

          {record.signature && (
            <div className="rounded-lg border border-border bg-background p-2.5">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Assinatura do cliente
              </p>
              <img
                src={record.signature}
                alt="Assinatura do cliente"
                className="h-16 w-full max-w-[200px] rounded border border-border bg-white object-contain"
              />
            </div>
          )}

          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="size-3.5 text-primary" /> Criado em {formatDateStr(record.createdAt, dateFormat)} às {new Date(record.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>

          {onShowHistory && (record.plate || record.clientName) && (
            <button
              onClick={() => onShowHistory(record)}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-primary/50 py-2.5 text-sm font-semibold text-primary"
            >
              <History className="size-4" /> Ver histórico deste cliente
            </button>
          )}
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
