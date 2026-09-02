'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Camera, CheckCircle2, ChevronDown, Clock, FileText, LayoutGrid, Menu, PackageSearch, Plus, Search, Bell, CircleHelp } from 'lucide-react'
import DraggableFloatingButton from './draggable-floating-button'

const STATUS_ICONS = {
  em_andamento: Clock,
  concluido: CheckCircle2,
  aguardando_peca: PackageSearch,
} as const
import type { AppSettings, FontScale, ServiceCategory, ServiceRecord, ServiceStatus } from '@/lib/types'
import { CATEGORY_LABELS, FONT_SCALE_VALUES, STATUS_LABELS, STATUS_LABELS_SHORT, STATUS_COLORS, isPendingSchedule } from '@/lib/types'
import { parseCurrency } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'
import { normalizeImageOrientation } from '@/lib/image'
import { generateBulkReportBlob } from '@/lib/pdf'
import { playAlertSound, unlockAudio } from '@/lib/alert-sound'
import { computeAchievements, DEFAULT_APP_SETTINGS, hashPin, loadSettings, saveSettings } from '@/lib/settings'
import {
  loadRecords,
  upsertRecord,
  deleteRecord as deleteRecordRemote,
  upsertManyRecords,
  clearAllRecords,
  migrateLegacyPhotos,
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
import { MainMenu } from './main-menu'
import { CategoryFilterModal } from './category-filter-modal'
import { SalesChartModal } from './sales-chart-modal'
import { OnboardingModal } from './onboarding-modal'
import { HelpModal } from './help-modal'
import { ConfirmModal } from './confirm-modal'
import { PinPad } from './pin-pad'
import { AchievementsScreen } from './achievements-screen'
import { LanguageModal } from './language-modal'
import { useToast } from './toast'

const ALERTED_STORAGE_KEY = 'autoservicos_alerted_schedules'

export function AutoservicosApp() {
  const showToast = useToast()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [records, setRecords] = useState<ServiceRecord[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'todos'>('todos')
  const [categoryFilter, setCategoryFilter] = useState<ServiceCategory | 'todas'>('todas')

  const [agendaOpen, setAgendaOpen] = useState(false)
  const [historyFor, setHistoryFor] = useState<ServiceRecord | null>(null)
  const [blinkingIds, setBlinkingIds] = useState<Set<string>>(new Set())
  const alertedRef = useRef<Set<string>>(new Set())

  const [dark, setDark] = useState(false)
  const [fontScale, setFontScale] = useState<FontScale>('normal')
  const [appSettings, setAppSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
  const [settingsReady, setSettingsReady] = useState(false)
  const [languageOpen, setLanguageOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [pinFlow, setPinFlow] = useState<'locked' | 'setup' | 'verify-disable' | 'verify-change' | null>(null)
  const [pinError, setPinError] = useState<string | null>(null)

  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<ServiceRecord | null>(null)
  const [initialPhotos, setInitialPhotos] = useState<string[]>([])
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [viewing, setViewing] = useState<ServiceRecord | null>(null)
  const [sharing, setSharing] = useState<ServiceRecord | null>(null)
  const [zoomPhoto, setZoomPhoto] = useState<{ photos: string[]; index: number } | null>(null)
  const [scheduleDate, setScheduleDate] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [optimizingPhotos, setOptimizingPhotos] = useState(false)

  async function handleOptimizePhotos() {
    if (optimizingPhotos) return
    setOptimizingPhotos(true)
    showToast('⚡ Otimizando fotos antigas, aguarde...', 'info')
    const result = await migrateLegacyPhotos()
    if (result === null) {
      showToast('❌ Não foi possível otimizar agora. Tente de novo.', 'error')
    } else if (result === 0) {
      showToast('✅ Nenhuma foto antiga encontrada — tudo já otimizado!', 'success')
    } else {
      const remoteRecords = await loadRecords()
      if (remoteRecords) setRecords(remoteRecords)
      showToast(`✅ ${result} registro(s) otimizado(s)! O app vai carregar mais rápido agora.`, 'success')
    }
    setOptimizingPhotos(false)
  }
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [salesChartOpen, setSalesChartOpen] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = loadSettings()
    setAppSettings(saved)
    setSettingsReady(true)
    if (saved.pinHash) setPinFlow('locked')
    if (!saved.skipOnboarding && !localStorage.getItem('autoservicos_onboarding_seen')) {
      setOnboardingOpen(true)
    }
  }, [])

  useEffect(() => {
    if (!settingsReady) return
    saveSettings(appSettings)
  }, [appSettings, settingsReady])

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
        if (appSettings.notificationsEnabled) {
          setBlinkingIds((prev) => new Set([...prev, ...justDue]))
          playAlertSound()
          const rec = records.find((r) => r.id === justDue[0])
          showToast(
            `🔔 Chegou a hora do agendamento${rec ? ` de ${rec.clientName || 'cliente'}` : ''}!`,
            'info',
          )
          setTimeout(() => {
            setBlinkingIds((prev) => {
              const next = new Set(prev)
              justDue.forEach((id) => next.delete(id))
              return next
            })
          }, 60000)
        }
      }
    }

    checkDue()
    const interval = setInterval(checkDue, 20000)
    return () => clearInterval(interval)
  }, [records, loaded, showToast, appSettings.notificationsEnabled])

  function closeOnboarding() {
    setOnboardingOpen(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem('autoservicos_onboarding_seen', '1')
    }
  }
  function handleChangeSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setAppSettings((prev) => ({ ...prev, [key]: value }))
    if (key === 'skipOnboarding' && typeof window !== 'undefined') {
      if (value) localStorage.setItem('autoservicos_onboarding_seen', '1')
      else localStorage.removeItem('autoservicos_onboarding_seen')
    }
  }

  async function handlePinSubmit(pin: string) {
    const hashed = await hashPin(pin)
    if (pinFlow === 'setup') {
      setAppSettings((prev) => ({ ...prev, pinHash: hashed }))
      setPinFlow(null)
      setPinError(null)
      showToast('🔒 PIN configurado com sucesso!', 'success')
      return
    }
    if (!appSettings.pinHash || hashed !== appSettings.pinHash) {
      setPinError('PIN incorreto. Tente novamente.')
      return
    }
    setPinError(null)
    if (pinFlow === 'verify-disable') {
      setAppSettings((prev) => ({ ...prev, pinHash: null }))
      setPinFlow(null)
      showToast('🔓 Bloqueio por PIN removido', 'success')
    } else if (pinFlow === 'verify-change') {
      setPinFlow('setup')
    } else {
      setPinFlow(null)
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

  // Autofoco no campo de busca assim que ele é aberto
  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus()
  }, [searchOpen])

  // Escala de fonte
  useEffect(() => {
    // Aplica só na variável --app-font-scale (afeta unicamente o tamanho
    // do texto — ver globals.css). O font-size do <html> nunca é mais
    // tocado aqui, então o layout (larguras, ícones, paddings) fica
    // sempre estável, mesmo na fonte "Extra grande".
    const raw = FONT_SCALE_VALUES[fontScale] ?? FONT_SCALE_VALUES.normal
    const scale = Math.min(1.5, Math.max(1, parseFloat(raw) || 1))
    document.documentElement.style.setProperty('--app-font-scale', String(scale))
    if (loaded) localStorage.setItem('autoservicos_scale', fontScale)
    return () => {
      document.documentElement.style.removeProperty('--app-font-scale')
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
  const achievements = useMemo(() => computeAchievements(records), [records])

  // Nome exibido no cabeçalho ("Olá, Valter!"). O app só coleta e-mail no
  // cadastro (sem campo de nome), então usamos a parte antes do "@" como
  // um nome amigável, com a primeira letra maiúscula.
  const greetingName = (() => {
    const localPart = user?.email?.split('@')[0]
    if (!localPart) return null
    const cleaned = localPart.replace(/[._-]+/g, ' ').trim()
    const firstWord = cleaned.split(' ')[0]
    if (!firstWord) return null
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase()
  })()

  if (!settingsReady) {
    return <div className="flex h-[100dvh] items-center justify-center bg-background text-sm font-semibold text-muted-foreground">Carregando preferências...</div>
  }

  if (pinFlow === 'locked') {
    return <PinPad open mode="unlock" error={pinError} onSubmit={handlePinSubmit} />
  }

  return (
    <div className="mx-auto flex h-[100dvh] w-full max-w-[480px] flex-col overflow-hidden bg-background shadow-2xl sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-3xl sm:border sm:border-border">
      {/* Cabeçalho */}
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <div className="size-14 shrink-0 overflow-hidden rounded-xl">
          <Logo className="size-full" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-extrabold leading-tight tracking-tight">
            {greetingName ? `Olá, ${greetingName}!` : 'Autoserviços'}
          </h1>
          <p className="text-[11px] text-white/70">{records.length} registros salvos</p>
        </div>
        <button
          onClick={() => setSearchOpen(true)}
          aria-label="Buscar"
          title="Buscar"
          className="rounded-full p-2 transition hover:bg-white/15"
        >
          <Search className="size-5" />
        </button>
        <button
          onClick={() => setHelpOpen(true)}
          aria-label="Ajuda: como funciona o app"
          title="Como funciona o app"
          className="rounded-full p-2 transition hover:bg-white/15"
        >
          <CircleHelp className="size-5" />
        </button>
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu"
          className="relative rounded-full p-2 transition hover:bg-white/15"
        >
          <Menu className="size-5" />
          {(pendingRecords.length > 0 || scheduledCount > 0) && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-primary">
              {pendingRecords.length + scheduledCount}
            </span>
          )}
        </button>
      </header>

      {/* Busca */}
      <div className="space-y-2 border-b border-border bg-card px-4 py-2.5">
        {searchOpen && (
          <div className="flex items-center gap-2 animate-slide-in">
            <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-background px-3 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchOpen(false)
                    setSearch('')
                  }
                }}
                placeholder="Buscar por cliente, placa ou nota..."
                className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>
            <button
              onClick={() => {
                setSearchOpen(false)
                setSearch('')
              }}
              className="shrink-0 text-sm font-semibold text-primary"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Filtros de status e categoria */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => setStatusFilter('todos')}
            aria-label="Todos os status"
            className={`flex shrink-0 items-center justify-center rounded-full border px-3 py-1.5 text-xs font-semibold ${
              statusFilter === 'todos'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            Todos
          </button>
          {(Object.keys(STATUS_LABELS) as ServiceStatus[]).map((key) => {
            const Icon = STATUS_ICONS[key]
            const active = statusFilter === key
            return (
              <button
                key={key}
                onClick={() => setStatusFilter((v) => (v === key ? 'todos' : key))}
                aria-label={STATUS_LABELS[key]}
                title={STATUS_LABELS[key]}
                className="flex size-8 shrink-0 items-center justify-center rounded-full border"
                style={
                  active
                    ? { backgroundColor: STATUS_COLORS[key], borderColor: STATUS_COLORS[key], color: '#fff' }
                    : { borderColor: 'var(--border)', color: 'var(--muted-foreground)', background: 'var(--background)' }
                }
              >
                <Icon className="size-4" />
              </button>
            )
          })}
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
        <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] font-bold">
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `${STATUS_COLORS.em_andamento}22`, color: STATUS_COLORS.em_andamento }}>
            <Clock className="size-3" /> {monthByStatus.em_andamento}
          </span>
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `${STATUS_COLORS.concluido}22`, color: STATUS_COLORS.concluido }}>
            <CheckCircle2 className="size-3" /> {monthByStatus.concluido}
          </span>
          <span className="flex items-center gap-1 rounded-full px-2 py-0.5" style={{ backgroundColor: `${STATUS_COLORS.aguardando_peca}22`, color: STATUS_COLORS.aguardando_peca }}>
            <PackageSearch className="size-3" /> {monthByStatus.aguardando_peca}
          </span>
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
        {!loaded ? (
          <div className="space-y-2.5 pb-24">
            {[0, 1, 2].map((i) => (
              <div key={i} className="animate-pulse rounded-app border border-border bg-card p-4">
                <div className="mb-2 h-4 w-1/3 rounded bg-background" />
                <div className="mb-1.5 h-3 w-1/2 rounded bg-background" />
                <div className="h-3 w-1/4 rounded bg-background" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
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
                onZoomPhoto={(photos, index) => setZoomPhoto({ photos, index })}
                alerting={blinkingIds.has(record.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Botões flutuantes com arraste por pressão longa */}
      <DraggableFloatingButton
        initial={{ x: window.innerWidth - 75, y: window.innerHeight - 250 }}
        onClick={() => cameraInputRef.current?.click()}
        className="flex size-14 items-center justify-center rounded-full shadow-lg bg-card text-primary ring-1 ring-primary/30"
      >
        <Camera className="size-6" />
      </DraggableFloatingButton>

      <DraggableFloatingButton
        initial={{ x: window.innerWidth - 75, y: window.innerHeight - 170 }}
        onClick={() => {
          setEditing(null)
          setInitialPhotos([])
          setEditorOpen(true)
        }}
        className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
      >
        <Plus className="size-7" />
      </DraggableFloatingButton>
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

      {/* Modais */}
      <RecordEditorModal
        open={editorOpen}
        editing={editing}
        initialPhotos={initialPhotos}
        userId={user?.id ?? null}
        onClose={() => {
          setEditorOpen(false)
          setEditing(null)
          setInitialPhotos([])
        }}
        onSave={handleSaveRecord}
        defaultCategory={appSettings.defaultCategory}
        smartPaste={appSettings.smartPaste}
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
        onZoomPhoto={(photos, index) => setZoomPhoto({ photos, index })}
        onShowHistory={(r) => setHistoryFor(r)}
        dateFormat={appSettings.dateFormat}
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
        dateFormat={appSettings.dateFormat}
      />
      <CategoryFilterModal
        open={categoryModalOpen}
        value={categoryFilter}
        onClose={() => setCategoryModalOpen(false)}
        onSelect={setCategoryFilter}
      />
      <SalesChartModal open={salesChartOpen} records={records} onClose={() => setSalesChartOpen(false)} />
      <ScheduleModal dateStr={scheduleDate} onClose={() => setScheduleDate(null)} onSave={handleScheduleSave} />
      <ShareModal record={sharing} onClose={() => setSharing(null)} dateFormat={appSettings.dateFormat} />
      <PhotoZoom
        photos={zoomPhoto?.photos ?? []}
        initialIndex={zoomPhoto?.index ?? 0}
        onClose={() => setZoomPhoto(null)}
      />
      <CalendarPanel
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        records={records}
        onPickDate={(d) => setScheduleDate(d)}
        onDeleteEvent={handleDeleteEvent}
        weekStartDay={appSettings.weekStartDay}
      />
      <MainMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        calendarActive={calendarOpen}
        scheduledCount={scheduledCount}
        pendingCount={pendingRecords.length}
        onToggleCalendar={() => setCalendarOpen((v) => !v)}
        onOpenAgenda={() => setAgendaOpen(true)}
        onOpenDashboard={() => setSalesChartOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
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
        onOptimizePhotos={handleOptimizePhotos}
        optimizing={optimizingPhotos}
        appSettings={appSettings}
        onChangeSetting={handleChangeSetting}
        onOpenLanguage={() => setLanguageOpen(true)}
        onOpenAchievements={() => setAchievementsOpen(true)}
        onEnablePin={() => { setPinError(null); setPinFlow('setup') }}
        onChangePin={() => { setPinError(null); setPinFlow('verify-change') }}
        onDisablePin={() => { setPinError(null); setPinFlow('verify-disable') }}
        onLockNow={() => { setSettingsOpen(false); setPinError(null); setPinFlow('locked') }}
      />
      <LanguageModal
        open={languageOpen}
        value={appSettings.language}
        onChange={(value) => handleChangeSetting('language', value)}
        onClose={() => setLanguageOpen(false)}
      />
      <AchievementsScreen open={achievementsOpen} achievements={achievements} onClose={() => setAchievementsOpen(false)} />
      <PinPad
        open={pinFlow === 'setup' || pinFlow === 'verify-disable' || pinFlow === 'verify-change'}
        mode={pinFlow === 'setup' ? 'create' : 'verify'}
        title={pinFlow === 'verify-disable' ? 'Remover bloqueio' : pinFlow === 'verify-change' ? 'Alterar PIN' : undefined}
        subtitle={pinFlow === 'verify-disable' ? 'Digite o PIN atual para remover a proteção.' : pinFlow === 'verify-change' ? 'Digite o PIN atual antes de criar um novo.' : undefined}
        error={pinError}
        onSubmit={handlePinSubmit}
        onCancel={() => { setPinFlow(null); setPinError(null) }}
      />
      <OnboardingModal open={onboardingOpen} onClose={closeOnboarding} />
      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
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