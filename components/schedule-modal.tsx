'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, X } from 'lucide-react'
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
  const [date, setDate] = useState('')
  const [time, setTime] = useState('12:00')
  const [note, setNote] = useState('')
  const [recording, setRecording] = useState(false)
  const recognitionRef = useRef<any>(null)
  const dictationBaseRef = useRef('')

  useEffect(() => {
    if (dateStr) {
      setClient('')
      setPlate('')
      setDate(dateStr)
      setTime('12:00')
      setNote('')
    } else {
      recognitionRef.current?.stop()
    }
  }, [dateStr])

  if (!dateStr) return null

  // Ditado por voz: em vez de digitar, o usuário fala e o texto vai para a observação.
  function toggleDictation() {
    if (recording) {
      recognitionRef.current?.stop()
      return
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
    if (!SpeechRecognition) {
      showToast('❌ Seu navegador não suporta ditado por voz', 'error')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = true
    recognition.interimResults = true
    dictationBaseRef.current = note

    recognition.onresult = (event: any) => {
      let finalChunk = ''
      let interimChunk = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) finalChunk += transcript
        else interimChunk += transcript
      }
      if (finalChunk) {
        dictationBaseRef.current = `${dictationBaseRef.current ? dictationBaseRef.current + ' ' : ''}${finalChunk.trim()}`
      }
      setNote(`${dictationBaseRef.current}${interimChunk ? ' ' + interimChunk : ''}`.trim())
    }
    recognition.onerror = () => {
      setRecording(false)
      showToast('❌ Não foi possível captar o áudio', 'error')
    }
    recognition.onend = () => {
      setRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setRecording(true)
  }

  function handleSave() {
    if (!client.trim()) {
      showToast('❌ Informe o nome do cliente', 'error')
      return
    }
    if (!date) {
      showToast('❌ Informe a data do agendamento', 'error')
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
      schedule: date,
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
          {/* Data editável: se o usuário marcou o dia/mês errado no calendário,
              pode corrigir aqui mesmo, sem precisar voltar ao menu e recomeçar. */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
            <span className="whitespace-nowrap text-sm font-semibold text-primary">Data</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 bg-transparent text-base text-foreground outline-none"
            />
          </div>
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
          <div className={`relative ${recording ? 'mb-4' : ''}`}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observação (opcional)"
              rows={2}
              className={`w-full resize-none rounded-lg border bg-background px-3 py-2.5 pr-12 text-base text-foreground outline-none focus:border-primary ${
                recording ? 'border-danger' : 'border-border'
              }`}
            />
            <button
              type="button"
              onClick={toggleDictation}
              aria-label={recording ? 'Parar ditado por voz' : 'Falar a observação em vez de digitar'}
              title={recording ? 'Parar ditado por voz' : 'Falar a observação em vez de digitar'}
              className={`absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-full transition ${
                recording ? 'animate-pulse bg-danger text-white' : 'bg-primary text-primary-foreground hover:bg-primary-dark'
              }`}
            >
              <Mic className="size-3.5" />
            </button>
            {recording && <span className="absolute -bottom-5 right-1 text-xs font-semibold text-danger">Ouvindo...</span>}
          </div>
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
