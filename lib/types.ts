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

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter',
  isBold: true,
  isItalic: false,
  isUnderline: false,
  color: '#1A1A1A',
  fontSize: 16,
}

export type FontScale = 'normal' | 'medium' | 'large' | 'xlarge'

export const FONT_SCALE_VALUES: Record<FontScale, string> = {
  normal: '100%',
  medium: '112%',
  large: '125%',
  xlarge: '140%',
}
