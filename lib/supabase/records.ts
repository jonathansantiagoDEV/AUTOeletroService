import type { ServiceCategory, ServiceRecord, ServiceStatus, TextStyle } from '@/lib/types'
import { DEFAULT_TEXT_STYLE } from '@/lib/types'
import { createClient } from './client'

const TABLE = 'service_records'

// Formato usado no banco (snake_case)
interface ServiceRecordRow {
  id: string
  user_id: string
  client_name: string
  client_phone: string | null
  note_text: string
  plate: string
  price: string
  photos: string[]
  text_style: TextStyle
  schedule: string | null
  schedule_time: string | null
  status: string | null
  category: string | null
  signature: string | null
  created_at: string
}

function rowToRecord(row: ServiceRecordRow): ServiceRecord {
  return {
    id: row.id,
    clientName: row.client_name,
    clientPhone: row.client_phone ?? '',
    noteText: row.note_text,
    plate: row.plate,
    price: row.price,
    photos: Array.isArray(row.photos) ? row.photos : [],
    textStyle: row.text_style ?? DEFAULT_TEXT_STYLE,
    schedule: row.schedule,
    scheduleTime: row.schedule_time,
    status: (row.status as ServiceStatus) ?? 'em_andamento',
    category: (row.category as ServiceCategory) ?? null,
    signature: row.signature ?? null,
    createdAt: row.created_at,
  }
}

function recordToRow(record: ServiceRecord, userId: string) {
  return {
    id: record.id,
    user_id: userId,
    client_name: record.clientName,
    client_phone: record.clientPhone || null,
    note_text: record.noteText,
    plate: record.plate,
    price: record.price,
    photos: record.photos,
    text_style: record.textStyle,
    schedule: record.schedule,
    schedule_time: record.scheduleTime,
    status: record.status,
    category: record.category ?? null,
    signature: record.signature ?? null,
    created_at: record.createdAt,
  }
}

export async function getCurrentUser() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function loadRecords(): Promise<ServiceRecord[] | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar registros:', error.message)
    return null
  }
  return (data as ServiceRecordRow[]).map(rowToRecord)
}

export async function upsertRecord(record: ServiceRecord): Promise<boolean> {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return false

  const { error } = await supabase.from(TABLE).upsert(recordToRow(record, user.id))
  if (error) {
    console.error('Erro ao salvar registro:', error.message)
    return false
  }
  return true
}

export async function deleteRecord(id: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from(TABLE).delete().eq('id', id)
  if (error) {
    console.error('Erro ao excluir registro:', error.message)
    return false
  }
  return true
}

export async function upsertManyRecords(records: ServiceRecord[]): Promise<boolean> {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return false

  const rows = records.map((r) => recordToRow(r, user.id))
  const { error } = await supabase.from(TABLE).upsert(rows)
  if (error) {
    console.error('Erro ao importar registros:', error.message)
    return false
  }
  return true
}

export async function clearAllRecords(): Promise<boolean> {
  const supabase = createClient()
  const user = await getCurrentUser()
  if (!user) return false

  const { error } = await supabase.from(TABLE).delete().eq('user_id', user.id)
  if (error) {
    console.error('Erro ao apagar registros:', error.message)
    return false
  }
  return true
}
