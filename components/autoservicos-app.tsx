'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Camera, CalendarDays, FileText, Plus, Search, Settings } from 'lucide-react'
import type { FontScale, ServiceRecord } from '@/lib/types'
import { FONT_SCALE_VALUES } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {
  loadRecords,
  upsertRecord,
  deleteRecord as deleteRecordRemote,
  upsertManyRecords,
  clearAllRecords,
} from '@/lib/supabase/records'
import { Logo } from './logo'
import { RecordCard } from './record-card'
import { RecordEditorModal } from './record-editor-modal'
import { CalendarPanel } from './calendar-panel'
import { ScheduleModal } from './schedule-modal'
import { ViewRecordModal } from './view-record-modal'
import { ShareModal } from './share-modal'
import { PhotoZoom } from './photo-zoom'
import { SettingsSidebar } from './settings-sidebar'
import { useToast } from './toast'

export function AutoservicosApp() {
  const showToast = useToast()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')

  const [dark, setDark] = useState(false)
  const [fontScale, setFontScale] = useState<FontScale>('normal')

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceRecord | null>(null)
  const [initialPhotos, setInitialPhotos] = useState<string[]>([])
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [viewing, setViewing] = useState<ServiceRecord | null>(null)
  const [sharing, setSharing] = useState<ServiceRecord | null>(null)
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null)
  const [scheduleDate, setScheduleDate] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Carregar usuário, registros e preferências
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function loadForUser(attempt = 1) {
      const remoteRecords = await loadRecords()
      if (cancelled) return

      if (remoteRecords === null) {
        // Falha ao carregar (ex.: instabilidade de rede). NÃO apaga os registros
        // que já estão na tela — tenta de novo automaticamente antes de desistir.
        if (attempt < 3) {
          setTimeout(() => loadForUser(attempt + 1), 1000 * attempt)
        } else {
          showToast('⚠️ Não foi possível atualizar os registros. Verifique sua conexão.', 'error')
          setLoaded(true)
        }
        return
      }

      setRecords(remoteRecords)
      setLoaded(true)
    }

    // Espera a sessão de login ser confirmada antes de buscar os registros,
    // evitando que o banco negue o acesso por a sessão ainda não estar pronta.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return
      setUser(session?.user ?? null)
      if (session?.user) {
        loadForUser()
      } else {
        setLoaded(true)
      }
    })

    const savedDark = localStorage.getItem('autoservicos_dark') === '1'
    const savedScale = (localStorage.getItem('autoservicos_scale') as FontScale) || 'normal'
    setDark(savedDark)
    setFontScale(savedScale)

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        router.replace('/login')
      } else if (event === 'SIGNED_IN') {
        loadForUser()
      }
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [router])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/login')
  }

  // Modo escuro
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    if (loaded) localStorage.setItem('autoservicos_dark', dark ? '1' : '0')
  }, [dark, loaded])

  // Escala de fonte
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SCALE_VALUES[fontScale]
    if (loaded) localStorage.setItem('autoservicos_scale', fontScale)
    return () => {
      document.documentElement.style.fontSize = ''
    }
  }, [fontScale, loaded])

  const filtered = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    if (!search.trim()) return sorted
    const q = search.toLowerCase()
    return sorted.filter(
      (r) =>
        r.clientName.toLowerCase().includes(q) ||
        r.plate.toLowerCase().includes(q) ||
        r.noteText.toLowerCase().includes(q),
    )
  }, [records, search])

  async function handleSaveRecord(record: ServiceRecord): Promise<boolean> {
    const ok = await upsertRecord(record)
    if (!ok) {
      showToast('❌ Não foi possível salvar no banco de dados', 'error')
      return false
    }
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === record.id)
      return exists ? prev.map((r) => (r.id === record.id ? record : r)) : [record, ...prev]
    })
    setEditorOpen(false)
    setEditing(null)
    setViewing(null)
    showToast(editing ? '✅ Registro atualizado!' : '✅ Registro salvo!', 'success')
    return true
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este registro?')) return
    const ok = await deleteRecordRemote(id)
    if (!ok) {
      showToast('❌ Não foi possível excluir no banco de dados', 'error')
      return
    }
    setRecords((prev) => prev.filter((r) => r.id !== id))
    setViewing(null)
    showToast('🗑️ Registro excluído', 'success')
  }

  async function handleScheduleSave(record: ServiceRecord) {
    const ok = await upsertRecord(record)
    if (!ok) {
      showToast('❌ Não foi possível salvar no banco de dados', 'error')
      return
    }
    setRecords((prev) => [record, ...prev])
    setScheduleDate(null)
    showToast('✅ Agendamento confirmado!', 'success')
  }

  async function handleDeleteEvent(id: string) {
    const target = records.find((r) => r.id === id)
    if (!target) return
    const updated = { ...target, schedule: null, scheduleTime: null }
    const ok = await upsertRecord(updated)
    if (!ok) {
      showToast('❌ Não foi possível atualizar no banco de dados', 'error')
      return
    }
    setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)))
    showToast('🗑️ Agendamento removido', 'success')
  }

  function handleExport() {
    const data = JSON.stringify(records, null, 2)
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `autoservicos_backup_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast('✅ Backup exportado!', 'success')
  }

  function handleImport(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(String(e.target?.result)) as ServiceRecord[]
        if (!Array.isArray(parsed)) throw new Error('Formato inválido')
        const ok = await upsertManyRecords(parsed)
        if (!ok) {
          showToast('❌ Não foi possível importar para o banco de dados', 'error')
          return
        }
        setRecords((prev) => {
          const map = new Map(prev.map((r) => [r.id, r]))
          parsed.forEach((r) => map.set(r.id, r))
          return Array.from(map.values())
        })
        showToast(`✅ ${parsed.length} registros importados!`, 'success')
        setSettingsOpen(false)
      } catch {
        showToast('❌ Arquivo inválido', 'error')
      }
    }
    reader.readAsText(file)
  }

  async function handleClearAll() {
    if (!confirm('Apagar TODOS os registros? Esta ação não pode ser desfeita.')) return
    const ok = await clearAllRecords()
    if (!ok) {
      showToast('❌ Não foi possível apagar no banco de dados', 'error')
      return
    }
    setRecords([])
    showToast('🗑️ Todos os registros foram apagados', 'success')
    setSettingsOpen(false)
  }

  const scheduledCount = records.filter((r) => r.schedule).length

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-background shadow-2xl sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border sm:border-border">
      {/* Cabeçalho */}
      <header className="flex items-center gap-2 bg-primary px-4 py-3 text-primary-foreground">
        <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-white">
          <Logo className="size-full" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold leading-tight tracking-tight">Autoserviços</h1>
          <p className="text-[11px] text-white/70">{records.length} registros salvos</p>
        </div>
        <button
          onClick={() => setCalendarOpen((v) => !v)}
          aria-label="Calendário"
          className={`relative rounded-full p-2 transition ${calendarOpen ? 'bg-white/25' : 'hover:bg-white/15'}`}
        >
          <CalendarDays className="size-5" />
          {scheduledCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-primary">
              {scheduledCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Configurações"
          className="rounded-full p-2 transition hover:bg-white/15"
        >
          <Settings className="size-5" />
        </button>
      </header>

      {/* Busca */}
      <div className="border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, placa ou nota..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Conteúdo */}
      <main className="thin-scroll flex-1 overflow-y-auto px-4 py-3">
        {calendarOpen && (
          <CalendarPanel
            records={records}
            onPickDate={(d) => setScheduleDate(d)}
            onDeleteEvent={handleDeleteEvent}
          />
        )}

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="size-8" />
            </div>
            <p className="font-semibold text-foreground">
              {search ? 'Nenhum resultado encontrado' : 'Nenhum registro ainda'}
            </p>
            <p className="max-w-[240px] text-sm text-muted-foreground">
              {search
                ? 'Tente buscar por outro termo.'
                : 'Toque no botão + para criar seu primeiro registro de serviço.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 pb-24">
            {filtered.map((record) => (
              <RecordCard
                key={record.id}
                record={record}
                onView={setViewing}
                onEdit={(r) => {
                  setEditing(r)
                  setEditorOpen(true)
                  setViewing(null)
                }}
                onDelete={handleDelete}
                onShare={setSharing}
                onZoomPhoto={setZoomPhoto}
              />
            ))}
          </div>
        )}
      </main>

      {/* Botão de câmera */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        aria-label="Registrar com a câmera"
        className="absolute bottom-24 right-5 flex size-12 items-center justify-center rounded-full bg-card text-red-700 dark:text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] ring-1 ring-primary/30 transition hover:scale-105 active:scale-95"
      >
        <Camera className="size-5" />
      </button>
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (!file) return
          const reader = new FileReader()
          reader.onload = (ev) => {
            const result = ev.target?.result
            if (typeof result === 'string') {
              setInitialPhotos([result])
              setEditing(null)
              setEditorOpen(true)
            }
          }
          reader.readAsDataURL(file)
          e.target.value = ''
        }}
      />

      {/* Botão flutuante */}
      <button
        onClick={() => {
          setEditing(null)
          setInitialPhotos([])
          setEditorOpen(true)
        }}
        aria-label="Novo registro"
        className="absolute bottom-5 right-5 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_6px_20px_rgba(139,26,26,0.5)] transition hover:scale-105 hover:bg-primary-dark active:scale-95"
      >
        <Plus className="size-7" />
      </button>

      {/* Modais */}
      <RecordEditorModal
        open={editorOpen}
        editing={editing}
        initialPhotos={initialPhotos}
        onClose={() => {
          setEditorOpen(false)
          setEditing(null)
          setInitialPhotos([])
        }}
        onSave={handleSaveRecord}
      />
      <ViewRecordModal
        record={viewing}
        onClose={() => setViewing(null)}
        onEdit={(r) => {
          setEditing(r)
          setEditorOpen(true)
          setViewing(null)
        }}
        onShare={(r) => setSharing(r)}
        onZoomPhoto={setZoomPhoto}
      />
      <ScheduleModal dateStr={scheduleDate} onClose={() => setScheduleDate(null)} onSave={handleScheduleSave} />
      <ShareModal record={sharing} onClose={() => setSharing(null)} />
      <PhotoZoom photo={zoomPhoto} onClose={() => setZoomPhoto(null)} />
      <SettingsSidebar
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        dark={dark}
        onToggleDark={() => setDark((v) => !v)}
        fontScale={fontScale}
        onChangeFontScale={setFontScale}
        recordCount={records.length}
        onExport={handleExport}
        onImport={handleImport}
        onClearAll={handleClearAll}
        userEmail={user?.email ?? null}
        onLogout={handleLogout}
      />
    </div>
  )
}
