export function timeAgo(createdAt: string): string {
  const dateObj = new Date(createdAt)
  const now = new Date()
  const diff = now.getTime() - dateObj.getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Agora'
  if (mins < 60) return mins + 'min'
  if (hours < 24) return hours + 'h'
  if (days < 7) return days + 'd'
  return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function fullDateTime(createdAt: string): string {
  const d = new Date(createdAt)
  return (
    d.toLocaleDateString('pt-BR') +
    ' as ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
}

export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
]

export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab']

export function toDateStr(year: number, month: number, day: number): string {
  return (
    year +
    '-' +
    String(month + 1).padStart(2, '0') +
    '-' +
    String(day).padStart(2, '0')
  )
}

// Converte "R$ 1.234,56" ou "1.234,56" para número (1234.56)
export function parseCurrency(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? 0 : num
}
