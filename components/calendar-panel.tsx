'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { ServiceRecord, WeekStartDay } from '@/lib/types'
import { DAY_NAMES, MONTH_NAMES, toDateStr } from '@/lib/format'

interface CalendarPanelProps {
  open: boolean
  onClose: () => void
  records: ServiceRecord[]
  onPickDate: (dateStr: string) => void
  onDeleteEvent: (id: string) => void
  weekStartDay?: WeekStartDay
}

export function CalendarPanel({ open, onClose, records, onPickDate, onDeleteEvent, weekStartDay = 'sunday' }: CalendarPanelProps) {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear] = useState(now.getFullYear())

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate())
  const [selectedDate, setSelectedDate] = useState(todayStr)

  const cells = useMemo(() => {
    const nativeFirstDay = new Date(year, month, 1).getDay()
    const firstDay = weekStartDay === 'monday' ? (nativeFirstDay + 6) % 7 : nativeFirstDay
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrev = new Date(year, month, 0).getDate()
    const result: { day: number; dateStr: string | null; other: boolean }[] = []
    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({ day: daysInPrev - i, dateStr: null, other: true })
    }
    for (let j = 1; j <= daysInMonth; j++) {
      result.push({ day: j, dateStr: toDateStr(year, month, j), other: false })
    }
    return result
  }, [month, year, weekStartDay])

  const events = records
    .filter((r) => r.schedule && r.schedule === selectedDate)
    .sort((a, b) => (a.scheduleTime || '00:00').localeCompare(b.scheduleTime || '00:00'))

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }
  function goToday() {
    setMonth(now.getMonth())
    setYear(now.getFullYear())
    setSelectedDate(todayStr)
  }


  const orderedDayNames = weekStartDay === 'monday' ? [...DAY_NAMES.slice(1), DAY_NAMES[0]] : DAY_NAMES
  // Ao escolher um dia, marca a data (abre o agendamento) e já fecha o
  // calendário, evitando que o pop-up fique aberto por cima da tela principal.
  function handleDayClick(dateStr: string) {
    setSelectedDate(dateStr)
    onPickDate(dateStr)
    onClose()
  }

  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[4500] flex items-center justify-center bg-black/50 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-[380px] rounded-app border border-border bg-card p-3 shadow-[var(--shadow-app)]"
      >
        <div className="mb-2 flex items-center justify-between">
          <button onClick={prevMonth} aria-label="Mês anterior" className="rounded-full p-1.5 text-primary hover:bg-background">
            <ChevronLeft className="size-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-foreground">
              {MONTH_NAMES[month]} {year}
            </span>
            <button onClick={goToday} className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground">
              Hoje
            </button>
          </div>
          <div className="flex items-center gap-0.5">
            <button onClick={nextMonth} aria-label="Próximo mês" className="rounded-full p-1.5 text-primary hover:bg-background">
              <ChevronRight className="size-5" />
            </button>
            <button onClick={onClose} aria-label="Fechar calendário" className="rounded-full p-1.5 text-muted-foreground hover:bg-background">
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {orderedDayNames.map((d) => (
            <div key={d} className="py-1 text-xs font-bold text-muted-foreground">
              {d}
            </div>
          ))}
          {cells.map((cell, i) => {
            if (cell.other) {
              return (
                <div key={i} className="py-1.5 text-sm text-muted-foreground/40">
                  {cell.day}
                </div>
              )
            }
            const hasEvent = records.some((r) => r.schedule === cell.dateStr)
            const isToday = cell.dateStr === todayStr
            const isSelected = cell.dateStr === selectedDate
            return (
              <button
                key={i}
                onClick={() => cell.dateStr && handleDayClick(cell.dateStr)}
                className={`relative rounded-lg py-1.5 text-sm transition ${
                  isSelected
                    ? 'bg-primary font-bold text-primary-foreground'
                    : isToday
                      ? 'bg-primary/15 font-bold text-primary'
                      : 'text-foreground hover:bg-background'
                }`}
              >
                {cell.day}
                {hasEvent && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-3 border-t border-border pt-2">
          {events.length === 0 ? (
            <div className="py-2 text-center text-sm text-muted-foreground">Nenhum agendamento</div>
          ) : (
            <div className="space-y-1.5">
              {events.map((e) => (
                <div key={e.id} className="flex items-center gap-2 rounded-lg bg-background px-2.5 py-1.5">
                  <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    {e.scheduleTime ? e.scheduleTime.slice(0, 5) : '--:--'}
                  </span>
                  <span className="flex-1 truncate text-sm font-semibold text-foreground">{e.clientName}</span>
                  <button
                    onClick={() => onDeleteEvent(e.id)}
                    aria-label="Remover agendamento"
                    className="rounded-full p-1 text-muted-foreground hover:text-danger"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

