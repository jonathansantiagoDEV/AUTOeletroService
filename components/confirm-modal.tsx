'use client'

import { AlertTriangle } from 'lucide-react'

interface ConfirmModalProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Excluir',
  cancelLabel = 'Cancelar',
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/60 p-4" onClick={onCancel}>
      <div
        className="animate-fade-up w-full max-w-[340px] overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center gap-3 px-5 pb-2 pt-6 text-center">
          <div
            className={`flex size-12 items-center justify-center rounded-full ${
              danger ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'
            }`}
          >
            <AlertTriangle className="size-6" />
          </div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{message}</p>
        </div>

        <div className="flex gap-2 p-4">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-border bg-background py-2.5 font-semibold text-foreground transition hover:bg-border/40"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 rounded-lg py-2.5 font-bold text-white transition ${
              danger ? 'bg-danger hover:bg-danger/90' : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
