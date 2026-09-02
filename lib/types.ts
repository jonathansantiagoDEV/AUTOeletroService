export interface TextStyle {
  fontFamily: string
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  color: string
  fontSize: number
}

export type ServiceStatus = 'em_andamento' | 'concluido' | 'aguardando_peca'

export const STATUS_LABELS: Record<ServiceStatus, string> = {
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  aguardando_peca: 'Aguardando peça',
}

// Rótulos curtos, usados nos filtros e badges compactos (economiza espaço na tela)
export const STATUS_LABELS_SHORT: Record<ServiceStatus, string> = {
  em_andamento: 'Andamento',
  concluido: 'Concluído',
  aguardando_peca: 'Peça',
}

export const STATUS_COLORS: Record<ServiceStatus, string> = {
  em_andamento: '#F57C00',
  concluido: '#2E7D32',
  aguardando_peca: '#C2185B',
}

export type ServiceCategory =
  | 'troca_oleo'
  | 'revisao'
  | 'funilaria'
  | 'eletrica'
  | 'mecanica'
  | 'pneus'
  | 'ar_condicionado'
  | 'outro'

export const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  troca_oleo: 'Troca de óleo',
  revisao: 'Revisão',
  funilaria: 'Funilaria',
  eletrica: 'Elétrica',
  mecanica: 'Mecânica geral',
  pneus: 'Pneus',
  ar_condicionado: 'Ar-condicionado',
  outro: 'Outro',
}

export const CATEGORY_ORDER: ServiceCategory[] = [
  'troca_oleo',
  'revisao',
  'mecanica',
  'funilaria',
  'eletrica',
  'pneus',
  'ar_condicionado',
  'outro',
]

export interface ServiceRecord {
  id: string
  clientName: string
  clientPhone: string
  noteText: string
  plate: string
  price: string
  photos: string[]
  textStyle: TextStyle
  schedule: string | null
  scheduleTime: string | null
  status: ServiceStatus
  category: ServiceCategory | null
  signature: string | null
  warrantyUntil: string | null
  createdAt: string
}

// Retorna o instante (Date) do agendamento, ou null se não houver agendamento
export function scheduleDateTime(record: Pick<ServiceRecord, 'schedule' | 'scheduleTime'>): Date | null {
  if (!record.schedule) return null
  const time = record.scheduleTime || '00:00'
  const d = new Date(`${record.schedule}T${time}:00`)
  return isNaN(d.getTime()) ? null : d
}

// Um registro é "agendamento pendente" quando tem data/hora futura — ainda não chegou a vez dele
export function isPendingSchedule(record: Pick<ServiceRecord, 'schedule' | 'scheduleTime'>, now: Date = new Date()): boolean {
  const dt = scheduleDateTime(record)
  return dt !== null && dt.getTime() > now.getTime()
}

// Quantos dias faltam de garantia (número negativo = já venceu). Retorna null se não houver garantia definida.
export function warrantyDaysRemaining(record: Pick<ServiceRecord, 'warrantyUntil'>, now: Date = new Date()): number | null {
  if (!record.warrantyUntil) return null
  const end = new Date(`${record.warrantyUntil}T23:59:59`)
  if (isNaN(end.getTime())) return null
  return Math.ceil((end.getTime() - now.getTime()) / 86400000)
}

// Garantia vencida
export function isWarrantyExpired(record: Pick<ServiceRecord, 'warrantyUntil'>, now: Date = new Date()): boolean {
  const days = warrantyDaysRemaining(record, now)
  return days !== null && days < 0
}

// Garantia perto de vencer (padrão: 7 dias ou menos, mas ainda não vencida)
export function isWarrantyExpiringSoon(
  record: Pick<ServiceRecord, 'warrantyUntil'>,
  daysThreshold = 7,
  now: Date = new Date(),
): boolean {
  const days = warrantyDaysRemaining(record, now)
  return days !== null && days >= 0 && days <= daysThreshold
}

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  isBold: true,
  isItalic: false,
  isUnderline: false,
  color: '#1A1A1A',
  fontSize: 16,
}

export type FontScale = 'normal' | 'medium' | 'large' | 'xlarge'

// Multiplicadores aplicados apenas à variável --app-font-scale (ver
// globals.css), que por sua vez só afeta os tamanhos de texto (--text-*)
// do Tailwind. Layout, ícones e espaçamentos usam rem "puro" e não são
// afetados — por isso podemos usar valores mais generosos aqui sem
// quebrar a tela.
export const FONT_SCALE_VALUES: Record<FontScale, string> = {
  normal: '1',
  medium: '1.12',
  large: '1.25',
  xlarge: '1.4',
}


export type DateFormat = 'dd/mm/yyyy' | 'mm/dd/yyyy'
export type WeekStartDay = 'sunday' | 'monday'
export type AppLanguage = 'pt-BR'

export interface AppSettings {
  notificationsEnabled: boolean
  skipOnboarding: boolean
  defaultCategory: ServiceCategory | null
  smartPaste: boolean
  dateFormat: DateFormat
  weekStartDay: WeekStartDay
  language: AppLanguage
  pinHash: string | null
}

export interface AchievementProgress {
  id: string
  title: string
  description: string
  current: number
  target: number
  unlocked: boolean
  icon: 'spark' | 'service' | 'check' | 'client' | 'value'
}

export function formatDateStr(value: string | Date | null | undefined, format: DateFormat = 'dd/mm/yyyy'): string {
  if (!value) return '---'
  const d = value instanceof Date ? value : new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(d.getTime())) return '---'
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return format === 'mm/dd/yyyy' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`
}
