'use client'

import { useMemo } from 'react'
import { BarChart3, TrendingDown, TrendingUp, X } from 'lucide-react'
import type { ServiceCategory, ServiceRecord } from '@/lib/types'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/types'
import { parseCurrency, MONTH_NAMES } from '@/lib/format'

interface SalesChartModalProps {
  open: boolean
  records: ServiceRecord[]
  onClose: () => void
}

function currency(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function SalesChartModal({ open, records, onClose }: SalesChartModalProps) {
  const stats = useMemo(() => {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const prevRef = new Date(year, month - 1, 1)
    const prevYear = prevRef.getFullYear()
    const prevMonth = prevRef.getMonth()

    const dailyRevenue = Array.from({ length: daysInMonth }, () => 0)
    let monthTotal = 0
    let monthCount = 0
    let prevMonthTotal = 0
    const byCategory = {} as Record<ServiceCategory, number>

    records.forEach((r) => {
      const d = new Date(r.createdAt)
      const value = parseCurrency(r.price)
      if (d.getFullYear() === year && d.getMonth() === month) {
        dailyRevenue[d.getDate() - 1] += value
        monthTotal += value
        monthCount += 1
        const key = r.category ?? 'outro'
        byCategory[key] = (byCategory[key] ?? 0) + value
      } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
        prevMonthTotal += value
      }
    })

    const categoryBreakdown = CATEGORY_ORDER.map((c) => ({ category: c, total: byCategory[c] ?? 0 }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)

    const maxDaily = Math.max(1, ...dailyRevenue)
    const maxCategory = Math.max(1, ...categoryBreakdown.map((c) => c.total))
    const trend = prevMonthTotal > 0 ? ((monthTotal - prevMonthTotal) / prevMonthTotal) * 100 : null

    return {
      daysInMonth,
      dailyRevenue,
      monthTotal,
      monthCount,
      categoryBreakdown,
      maxDaily,
      maxCategory,
      trend,
      monthLabel: MONTH_NAMES[month],
    }
  }, [records])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[5300] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="animate-fade-up flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-2xl bg-card shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground">
          <div className="flex items-center gap-2">
            <BarChart3 className="size-5" />
            <h2 className="text-base font-bold">Vendas e faturamento • {stats.monthLabel}</h2>
          </div>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>

        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-4">
          {/* Resumo do mês */}
          <div className="flex gap-3">
            <div className="flex-1 rounded-xl border border-border bg-background p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Faturado</p>
              <p className="text-lg font-extrabold text-success">{currency(stats.monthTotal)}</p>
              {stats.trend !== null && (
                <p
                  className={`mt-0.5 flex items-center justify-center gap-1 text-[11px] font-semibold ${
                    stats.trend >= 0 ? 'text-success' : 'text-danger'
                  }`}
                >
                  {stats.trend >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {Math.abs(stats.trend).toFixed(0)}% vs mês anterior
                </p>
              )}
            </div>
            <div className="flex-1 rounded-xl border border-border bg-background p-3 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Serviços</p>
              <p className="text-lg font-extrabold text-foreground">{stats.monthCount}</p>
            </div>
          </div>

          {/* Faturamento por dia */}
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Faturamento por dia
            </h3>
            {stats.monthTotal === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Nenhum faturamento registrado este mês ainda.
              </p>
            ) : (
              <>
                <div className="flex h-32 items-end gap-[2px] rounded-xl border border-border bg-background p-2">
                  {stats.dailyRevenue.map((v, i) => (
                    <div
                      key={i}
                      title={`Dia ${i + 1}: ${currency(v)}`}
                      className="h-full flex flex-1 items-end"
                    >
                      <div
                        className="w-full rounded-sm bg-primary/80 transition hover:bg-primary"
                        style={{ height: `${v > 0 ? Math.max(4, (v / stats.maxDaily) * 100) : 1}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>Dia 1</span>
                  <span>Dia {stats.daysInMonth}</span>
                </div>
              </>
            )}
          </div>

          {/* Faturamento por categoria */}
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Faturamento por categoria
            </h3>
            {stats.categoryBreakdown.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Sem dados de categoria este mês.
              </p>
            ) : (
              <div className="space-y-2.5">
                {stats.categoryBreakdown.map((c) => (
                  <div key={c.category}>
                    <div className="mb-1 flex items-center justify-between text-xs font-semibold text-foreground">
                      <span>{CATEGORY_LABELS[c.category]}</span>
                      <span className="text-muted-foreground">{currency(c.total)}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.max(4, (c.total / stats.maxCategory) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
