'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import type { ServiceRecord } from '@/lib/types'
import { DEFAULT_TEXT_STYLE } from '@/lib/types'
import { generateId } from '@/lib/storage'
import { useToast } from './toast'

interface ScheduleModalProps {
  dateStr: string | null
  onClose: () => void
  onSave: (record: ServiceRecord) => void
}

export function ScheduleModal({ dateStr, onClose, onSave }: ScheduleModalProps) {
  const showToast = useToast()
  const [client, setClient] = useState('')
  const [plate, setPlate] = useState('')
  const [time, setTime] = useState('12:00')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (dateStr) {
      setClient('')
      setPlate('')
      setTime('12:00')
      setNote('')
    }
  }, [dateStr])

  if (!dateStr) return null

  const dateLabel = new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  function handleSave() {
    if (!client.trim()) {
      showToast('❌ Informe o nome do cliente', 'error')
      return
    }
    const record: ServiceRecord = {
      id: generateId(),
      clientName: client.trim(),
      clientPhone: '',
      plate: plate.trim().toUpperCase(),
      price: '',
      noteText: note.trim() || 'Agendamento via calendário',
      photos: [],
      textStyle: { ...DEFAULT_TEXT_STYLE },
      schedule: dateStr,
      scheduleTime: time,
      status: 'em_andamento',
      category: null,
      signature: null,
      createdAt: new Date().toISOString(),
    }
    onSave(record)
  }

  return (
    <div className="fixed inset-0 z-[4000] flex items-center justify-center bg-black/50 p-4">
      <div className="animate-fade-up w-full max-w-[380px] overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="text-base font-bold">Novo agendamento</h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-2.5 p-4">
          <p className="text-sm font-semibold text-primary">Data: {dateLabel}</p>
          <input
            value={client}
            onChange={(e) => setClient(e.target.value)}
            placeholder="Nome do cliente"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
          />
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Placa"
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base uppercase text-foreground outline-none focus:border-primary"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
          />
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Observação (opcional)"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2 border-t border-border p-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border bg-background py-2.5 font-semibold text-foreground">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-[2] rounded-lg bg-primary py-2.5 font-bold text-primary-foreground hover:bg-primary-dark">
            Agendar
          </button>
        </div>
      </div>
    </div>
  )
}
