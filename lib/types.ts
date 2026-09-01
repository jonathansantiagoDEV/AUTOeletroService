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
  createdAt: string
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
