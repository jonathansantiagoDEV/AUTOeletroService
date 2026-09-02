import type { AchievementProgress, AppSettings, ServiceRecord } from './types'
import { parseCurrency } from './format'

const SETTINGS_KEY = 'autoservicos_settings_v2'

export const DEFAULT_APP_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  skipOnboarding: false,
  defaultCategory: null,
  smartPaste: true,
  dateFormat: 'dd/mm/yyyy',
  weekStartDay: 'sunday',
  language: 'pt-BR',
  pinHash: null,
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_APP_SETTINGS
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_APP_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AppSettings>
    return { ...DEFAULT_APP_SETTINGS, ...parsed }
  } catch {
    return DEFAULT_APP_SETTINGS
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(`autoservicos:${pin}`)
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // fallback simples para ambientes sem Web Crypto; o PIN nunca é salvo em texto puro
  let hash = 2166136261
  for (const byte of data) {
    hash ^= byte
    hash = Math.imul(hash, 16777619)
  }
  return `fallback-${(hash >>> 0).toString(16)}`
}

export function computeAchievements(records: ServiceRecord[]): AchievementProgress[] {
  const completed = records.filter((r) => r.status === 'concluido').length
  const clients = new Set(records.map((r) => (r.plate || r.clientPhone || r.clientName).trim().toLowerCase()).filter(Boolean)).size
  const revenue = Math.round(records.reduce((sum, r) => sum + parseCurrency(r.price), 0))

  return [
    { id: 'first', title: 'Primeiro serviço', description: 'Cadastre seu primeiro atendimento.', current: records.length, target: 1, unlocked: records.length >= 1, icon: 'spark' },
    { id: 'ten', title: 'Oficina em movimento', description: 'Chegue a 10 serviços cadastrados.', current: records.length, target: 10, unlocked: records.length >= 10, icon: 'service' },
    { id: 'fifty', title: '50 serviços', description: 'Mantenha o histórico de 50 atendimentos.', current: records.length, target: 50, unlocked: records.length >= 50, icon: 'service' },
    { id: 'completed', title: 'Missão cumprida', description: 'Conclua 10 serviços.', current: completed, target: 10, unlocked: completed >= 10, icon: 'check' },
    { id: 'clients', title: 'Clientes na casa', description: 'Atenda 20 clientes diferentes.', current: clients, target: 20, unlocked: clients >= 20, icon: 'client' },
    { id: 'revenue', title: 'R$ 10 mil registrados', description: 'Registre R$ 10.000 em serviços.', current: revenue, target: 10000, unlocked: revenue >= 10000, icon: 'value' },
  ]
}
