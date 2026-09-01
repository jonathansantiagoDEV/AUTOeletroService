'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Camera, CalendarDays, CalendarClock, ChevronDown, FileText, LayoutGrid, Plus, Search, Settings, Bell, BarChart3 } from 'lucide-react'
import type { FontScale, ServiceCategory, ServiceRecord, ServiceStatus } from '@/lib/types'
import { CATEGORY_LABELS, FONT_SCALE_VALUES, STATUS_LABELS, isPendingSchedule } from '@/lib/types'
import { parseCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { normalizeImageOrientation } from '@/lib/image'
import { generateBulkReportBlob } from '@/lib/pdf'
import { playAlertSound, unlockAudio } from '@/lib/alert-sound'
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
import { AgendaPage } from './agenda-page'
import { ScheduleModal } from './schedule-modal'
import { ViewRecordModal } from './view-record-modal'
import { ClientHistoryModal } from './client-history-modal'
import { ShareModal } from './share-modal'
import { PhotoZoom } from './photo-zoom'
import { SettingsSidebar } from './settings-sidebar'
import { CategoryFilterModal } from './category-filter-modal'
import { SalesChartModal } from './sales-chart-modal'
import { OnboardingModal } from './onboarding-modal'
import { ConfirmModal } from './confirm-modal'
import { useToast } from './toast'

const ALERTED_STORAGE_KEY = 'autoservicos_alerted_schedules'

export function AutoservicosApp() {
  const showToast = useToast()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'todos'>('todos')
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'todas'>('todas')

  const [agendaOpen, setAgendaOpen] = useState(false)
  const [historyFor, setHistoryFor] = useState<ServiceRecord | null>(null)
  const [blinkingIds, setBlinkingIds] = useState<Set<string>>(new Set())
  const alertedRef = useRef<Set<string>>(new Set())

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
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [salesChartOpen, setSalesChartOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!localStorage.getItem('autoservicos_onboarding_seen')) {
      setOnboardingOpen(true)
    }
  }, [])

  // Carrega do localStorage quais agendamentos já dispararam alerta, para não repetir
  // o som/piscar toda vez que o app é reaberto.
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const saved = JSON.parse(localStorage.getItem(ALERTED_STORAGE_KEY) || '[]') as string[]
      alertedRef.current = new Set(saved)
    } catch {
      alertedRef.current = new Set()
    }
    // Libera o áudio na primeira interação do usuário (alguns navegadores bloqueiam som automático)
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  // Verifica periodicamente se algum agendamento pendente acabou de chegar na hora.
  // Quando isso acontece, o registro passa a aparecer na tela principal (deixa de ser
  // "pendente") e piscamos o card + tocamos um alerta sonoro para chamar atenção.
  useEffect(() => {
    if (!loaded) return

    function checkDue() {
      const now = new Date()
      const justDue: string[] = []
      records.forEach((r) => {
        if (!r.schedule || !r.scheduleTime) return
        if (isPendingSchedule(r, now)) return // ainda não chegou a hora
        if (alertedRef.current.has(r.id)) return // já alertamos sobre esse
        // Só considera "recém-chegado" se o horário passou há pouco tempo (evita
        // disparar alerta antigo para agendamentos de dias atrás ao reabrir o app)
        const dt = new Date(`${r.schedule}T${r.scheduleTime}:00`)
        if (isNaN(dt.getTime())) return
        if (now.getTime() - dt.getTime() > 30 * 60 * 1000) {
          // Passou de 30min: marca como já visto, sem alertar (evita alerta "velho")
          alertedRef.current.add(r.id)
          return
        }
        justDue.push(r.id)
        alertedRef.current.add(r.id)
      })

      if (justDue.length > 0) {
        localStorage.setItem(ALERTED_STORAGE_KEY, JSON.stringify(Array.from(alertedRef.current)))
        setBlinkingIds((prev) => new Set([...prev, ...justDue]))
        playAlertSound()
        const rec = records.find((r) => r.id === justDue[0])
        showToast(
          `🔔 Chegou a hora do agendamento${rec ? ` de ${rec.clientName || 'cliente'}` : ''}!`,
          'info',
        )
        // Para de piscar depois de um tempo, mas o registro continua na tela principal
        setTimeout(() => {
          setBlinkingIds((prev) => {
            const next = new Set(prev)
            justDue.forEach((id) => next.delete(id))
            return next
          })
        }, 60000)
      }
    }

    checkDue()
    const interval = setInterval(checkDue, 20000)
    return () => clearInterval(interval)
  }, [records, loaded, showToast])

  function closeOnboarding() {
    setOnboardingOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoservicos_onboarding_seen', '1')
    }
  }
  const [deleteTarget, setDeleteTarget] = useState<ServiceRecord | null>(null)
  const [clearAllOpen, setClearAllOpen] = useState(false)

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

  // Agendamentos futuros ficam só na página de Agendamentos — somem da lista
  // principal até a hora chegar, quando então aparecem aqui automaticamente.
  const pendingRecords = useMemo(() => records.filter((r) => isPendingSchedule(r)), [records])

  const filtered = useMemo(() => {
    const sorted = [...records]
      .filter((r) => !isPendingSchedule(r))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    let result = sorted
    if (statusFilter !== 'todos') {
      result = result.filter((r) => (r.status ?? 'em_andamento') === statusFilter)
    }
    if (categoryFilter !== 'todas') {
      result = result.filter((r) => r.category === categoryFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.clientName.toLowerCase().includes(q) ||
          r.plate.toLowerCase().includes(q) ||
          r.noteText.toLowerCase().includes(q),
      )
    }
    return result
  }, [records, search, statusFilter, categoryFilter])

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

  function handleDelete(id: string) {
    const target = records.find((r) => r.id === id)
    if (!target) return
    setDeleteTarget(target)
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    const id = deleteTarget.id
    setDeleteTarget(null)
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

  function handleExportReport() {
    if (records.length === 0) {
      showToast('⚠️ Nenhum registro para exportar', 'error')
      return
    }
    const blob = generateBulkReportBlob(records)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio_servicos_${new Date().toISOString().slice(0, 10)}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    showToast('✅ Relatório em PDF exportado!', 'success')
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

  function handleClearAll() {
    setClearAllOpen(true)
  }

  async function confirmClearAll() {
    setClearAllOpen(false)
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

  const now = new Date()
  const monthRecords = records.filter((r) => {
    const d = new Date(r.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  })
  const monthTotal = monthRecords.reduce((sum, r) => sum + parseCurrency(r.price), 0)
  const monthCount = monthRecords.length
  const monthByStatus = {
    em_andamento: monthRecords.filter((r) => (r.status ?? 'em_andamento') === 'em_andamento').length,
    concluido: monthRecords.filter((r) => r.status === 'concluido').length,
    aguardando_peca: monthRecords.filter((r) => r.status === 'aguardando_peca').length,
  }

  const todayStr = now.toISOString().slice(0, 10)
  const todaySchedules = records.filter((r) => r.schedule === todayStr)

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
          onClick={() => setAgendaOpen(true)}
          aria-label="Agendamentos"
          className="relative rounded-full p-2 transition hover:bg-white/15"
        >
          <CalendarClock className="size-5" />
          {pendingRecords.length > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-primary">
              {pendingRecords.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setSalesChartOpen(true)}
          aria-label="Vendas e faturamento do mês"
          title="Vendas e faturamento do mês"
          className="rounded-full p-2 transition hover:bg-white/15"
        >
          <BarChart3 className="size-5" />
        </button>
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
      <div className="space-y-2 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, placa ou nota..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Filtros de status e categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => setStatusFilter('todos')}
            className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              statusFilter === 'todos'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            Todos
          </button>
          {(Object.keys(STATUS_LABELS) as ServiceStatus[]).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter((v) => (v === key ? 'todos' : key))}
              className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                statusFilter === key
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground'
              }`}
            >
              {STATUS_LABELS[key]}
            </button>
          ))}
          <button
            onClick={() => setCategoryModalOpen(true)}
            className={`flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
              categoryFilter !== 'todas'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            <LayoutGrid className="size-3.5" />
            {categoryFilter === 'todas' ? 'Categoria' : CATEGORY_LABELS[categoryFilter]}
            <ChevronDown className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Mini-dashboard financeiro do mês */}
      <div className="border-b border-border bg-card px-4 py-2">
        <div className="flex divide-x divide-border text-center">
          <div className="flex-1 px-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Faturado no mês</p>
            <p className="text-sm font-bold text-success">
              {monthTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="flex-1 px-2">
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Serviços no mês</p>
            <p className="text-sm font-bold text-foreground">{monthCount}</p>
          </div>
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-3 text-[11px] font-semibold text-muted-foreground">
          <span>🟠 {monthByStatus.em_andamento} em andamento</span>
          <span>🟢 {monthByStatus.concluido} concluídos</span>
          <span>🔴 {monthByStatus.aguardando_peca} aguard. peça</span>
        </div>
      </div>

      {/* Aviso de agendamentos de hoje */}
      {todaySchedules.length > 0 && (
        <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
          <Bell className="size-3.5 shrink-0" />
          Você tem {todaySchedules.length} agendamento{todaySchedules.length > 1 ? 's' : ''} para hoje.
        </div>
      )}

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
                alerting={blinkingIds.has(record.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Botão de câmera */}
      <button
        onClick={() => cameraInputRef.current?.click()}
        aria-label="Registrar com a câmera"
        className={`absolute bottom-24 right-5 flex size-14 items-center justify-center rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.25)] ring-1 transition hover:scale-105 active:scale-95 ${
          dark 
            ? 'bg-card text-white ring-white/30' 
            : 'bg-card text-primary ring-primary/30'
        }`}
      >
        <Camera className="size-6" />
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
          normalizeImageOrientation(file)
            .then((dataUrl) => {
              setInitialPhotos([dataUrl])
              setEditing(null)
              setEditorOpen(true)
            })
            .catch(() => {
              // Se a normalização falhar, não abre o editor com foto inválida
            })
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
        onShowHistory={(r) => setHistoryFor(r)}
      />
      <ClientHistoryModal
        open={!!historyFor}
        current={historyFor}
        records={records}
        onClose={() => setHistoryFor(null)}
        onSelect={(r) => {
          setHistoryFor(null)
          setViewing(r)
        }}
      />
      <AgendaPage
        open={agendaOpen}
        records={pendingRecords}
        onClose={() => setAgendaOpen(false)}
        onView={(r) => {
          setAgendaOpen(false)
          setViewing(r)
        }}
        onEdit={(r) => {
          setAgendaOpen(false)
          setEditing(r)
          setEditorOpen(true)
        }}
        onDelete={handleDelete}
      />
      <CategoryFilterModal
        open={categoryModalOpen}
        value={categoryFilter}
        onClose={() => setCategoryModalOpen(false)}
        onSelect={setCategoryFilter}
      />
      <SalesChartModal open={salesChartOpen} records={records} onClose={() => setSalesChartOpen(false)} />
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
        onExportReport={handleExportReport}
        onImport={handleImport}
        onClearAll={handleClearAll}
        userEmail={user?.email ?? null}
        onLogout={handleLogout}
        onShowTutorial={() => setOnboardingOpen(true)}
      />
      <OnboardingModal open={onboardingOpen} onClose={closeOnboarding} />
      <ConfirmModal
        open={!!deleteTarget}
        title="Excluir Registro"
        message={`Tem certeza que deseja excluir o registro de "${deleteTarget?.clientName || 'Cliente sem nome'}"?`}
        confirmLabel="Sim, excluir"
        cancelLabel="Cancelar"
        danger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <ConfirmModal
        open={clearAllOpen}
        title="Apagar todos os registros"
        message="Esta ação vai apagar TODOS os seus registros e não pode ser desfeita. Deseja continuar?"
        confirmLabel="Apagar tudo"
        onConfirm={confirmClearAll}
        onCancel={() => setClearAllOpen(false)}
      />
    </div>
  )
}