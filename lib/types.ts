export interface TextStyle {
  fontFamily: string
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  color: string
  fontSize: number
}

export interface ServiceRecord {
  id: string
  clientName: string
  noteText: string
  plate: string
  price: string
  photos: string[]
  textStyle: TextStyle
  schedule: string | null
  scheduleTime: string | null
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
