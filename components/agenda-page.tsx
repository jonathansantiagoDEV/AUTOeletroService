'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, Bell, Clock, Hash, Pencil, Trash2, UserCircle } from 'lucide-react'
import type { ServiceRecord } from '@/lib/types'
import { scheduleDateTime } from '@/lib/types'

interface AgendaPageProps {
  open: boolean
  records: ServiceRecord[]
  onClose: () => void
  onView: (record: ServiceRecord) => void
  onEdit: (record: ServiceRecord) => void
  onDelete: (id: string) => void
}

// Formata o tempo restante até o agendamento de forma legível ("em 2h 15min", "em 3 dias")
function timeUntil(target: Date, now: Date): string {
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return 'agora'
  const mins = Math.round(diffMs / 60000)
  if (mins < 60) return `em ${mins}min`
  const hours = Math.floor(mins / 60)
  const remMins = mins % 60
  if (hours < 24) return `em ${hours}h${remMins > 0 ? ` ${remMins}min` : ''}`
  const days = Math.floor(hours / 24)
  return `em ${days} dia${days > 1 ? 's' : ''}`
}

export function AgendaPage({ open, records, onClose, onView, onEdit, onDelete }: AgendaPageProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    if (!open) return
    const interval = setInterval(() => setNow(new Date()), 30000)
    return () => clearInterval(interval)
  }, [open])

  if (!open) return null

  const pending = records
    .map((r) => ({ record: r, dt: scheduleDateTime(r) }))
    .filter((x): x is { record: ServiceRecord; dt: Date } => x.dt !== null)
    .sort((a, b) => a.dt.getTime() - b.dt.getTime())

  return (
    <div className="fixed inset-0 z-[2500] flex flex-col bg-background">
      <header className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
        <button onClick={onClose} aria-label="Voltar" className="rounded-full p-2 hover:bg-white/15">
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold leading-tight">Agendamentos</h1>
          <p className="text-[11px] text-white/70">
            {pending.length === 0 ? 'Nenhum agendamento pendente' : `${pending.length} aguardando a hora`}
          </p>
        </div>
      </header>

      <main className="thin-scroll flex-1 overflow-y-auto px-4 py-3">
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bell className="size-8" />
            </div>
            <p className="font-semibold text-foreground">Nenhum agendamento pendente</p>
            <p className="max-w-[260px] text-sm text-muted-foreground">
              Quando você agendar um horário pelo calendário, ele aparece aqui até chegar a hora — então vai
              automaticamente para a tela principal com um alerta.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-6">
            {pending.map(({ record, dt }) => (
              <div
                key={record.id}
                onClick={() => onView(record)}
                className="cursor-pointer rounded-app border border-border bg-card p-4 shadow-[var(--shadow-app)] transition hover:border-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-1 flex-wrap items-center gap-1.5 text-base font-bold text-foreground">
                    <UserCircle className="inline size-4 text-primary" />
                    {record.clientName || 'Cliente'}
                    {record.plate && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
                        <Hash className="size-3" /> {record.plate}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      aria-label="Editar"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(record)
                      }}
                      className="rounded-full p-2 text-muted-foreground hover:bg-background hover:text-primary"
                    >
                      <Pencil className="size-4.5" />
                    </button>
                    <button
                      aria-label="Excluir"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(record.id)
                      }}
                      className="rounded-full p-2 text-muted-foreground hover:bg-background hover:text-danger"
                    >
                      <Trash2 className="size-4.5" />
                    </button>
                  </div>
                </div>

                {record.noteText && (
                  <p className="mt-1.5 truncate text-sm text-muted-foreground">{record.noteText}</p>
                )}

                <div className="mt-2.5 flex items-center justify-between rounded-lg bg-primary/10 px-3 py-2">
                  <span className="flex items-center gap-1.5 text-sm font-bold text-primary">
                    <Clock className="size-4" />
                    {dt.toLocaleDateString('pt-BR')} às {record.scheduleTime?.slice(0, 5)}
                  </span>
                  <span className="text-xs font-semibold text-primary">{timeUntil(dt, now)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
