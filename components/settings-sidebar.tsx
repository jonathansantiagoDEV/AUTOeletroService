'use client'

import { useRef, useState } from 'react'
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Database,
  Download,
  FileBarChart,
  Languages,
  LockKeyhole,
  LogOut,
  Minus,
  Moon,
  Plus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Trophy,
  Type,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import type { AppSettings, FontScale, ServiceCategory } from '@/lib/types'
import { CATEGORY_LABELS, CATEGORY_ORDER } from '@/lib/types'

interface SettingsSidebarProps {
  open: boolean
  onClose: () => void
  dark: boolean
  onToggleDark: () => void
  fontScale: FontScale
  onChangeFontScale: (scale: FontScale) => void
  appSettings: AppSettings
  onChangeSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  recordCount: number
  onExport: () => void
  onExportReport: () => void
  onImport: (file: File) => void
  onClearAll: () => void
  userEmail: string | null
  onLogout: () => void
  onOptimizePhotos: () => void
  optimizing: boolean
  onOpenLanguage: () => void
  onOpenAchievements: () => void
  onEnablePin: () => void
  onChangePin: () => void
  onDisablePin: () => void
  onLockNow: () => void
}

const FONT_ORDER: FontScale[] = ['normal', 'medium', 'large', 'xlarge']
const FONT_LABELS: Record<FontScale, string> = { normal: 'Normal', medium: 'Média', large: 'Grande', xlarge: 'Extra grande' }

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={(e) => { e.stopPropagation(); onChange(!checked) }} className={`relative h-7 w-12 shrink-0 rounded-full transition ${checked ? 'bg-primary' : 'bg-muted'}`}>
    <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </button>
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
    <div className="border-b border-border bg-background/60 px-4 py-2.5"><h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">{title}</h3></div>
    <div className="divide-y divide-border">{children}</div>
  </section>
}

function SettingRow({ icon: Icon, title, description, children, onClick, danger = false }: {
  icon: React.ElementType; title: string; description?: string; children?: React.ReactNode; onClick?: () => void; danger?: boolean
}) {
  const body = <div className="flex min-h-[66px] w-full items-center gap-3 px-4 py-3 text-left">
    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-danger/10 text-danger' : 'bg-primary/10 text-primary'}`}><Icon className="size-5" /></div>
    <div className="min-w-0 flex-1"><p className={`text-sm font-bold ${danger ? 'text-danger' : 'text-foreground'}`}>{title}</p>{description && <p className="mt-0.5 text-xs leading-4 text-muted-foreground">{description}</p>}</div>
    <div className="flex shrink-0 items-center gap-2">{children}{onClick && !children && <ChevronRight className="size-4 text-muted-foreground" />}</div>
  </div>
  return onClick ? <button type="button" onClick={onClick} className="w-full transition hover:bg-background/70 active:bg-primary/5">{body}</button> : body
}

export function SettingsSidebar({
  open, onClose, dark, onToggleDark, fontScale, onChangeFontScale, appSettings, onChangeSetting,
  recordCount, onExport, onExportReport, onImport, onClearAll, userEmail, onLogout, onOptimizePhotos,
  optimizing, onOpenLanguage, onOpenAchievements, onEnablePin, onChangePin, onDisablePin, onLockNow,
}: SettingsSidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [fontOpen, setFontOpen] = useState(false)
  const [dataOpen, setDataOpen] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const fontIndex = FONT_ORDER.indexOf(fontScale)
  const initial = (userEmail || '?').trim().charAt(0).toUpperCase()
  const pinEnabled = !!appSettings.pinHash

  function stepFont(delta: number) {
    const next = Math.min(FONT_ORDER.length - 1, Math.max(0, fontIndex + delta))
    onChangeFontScale(FONT_ORDER[next])
  }

  return <>
    <div onClick={onClose} className={`fixed inset-0 z-[5500] bg-black/55 backdrop-blur-[1px] transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`} />
    <aside style={{ width: 'min(410px, 94vw)', fontSize: '16px' }} className={`fixed left-0 top-0 z-[6000] flex h-full flex-col bg-background shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <header className="flex items-center gap-3 bg-primary px-5 py-4 text-primary-foreground">
        <div className="flex-1"><h2 className="text-xl font-extrabold">Configurações</h2><p className="text-xs text-white/70">Personalize o aplicativo do seu jeito</p></div>
        <button aria-label="Fechar configurações" onClick={onClose} className="flex size-10 items-center justify-center rounded-full transition hover:bg-white/15"><X className="size-5" /></button>
      </header>

      <div className="thin-scroll flex-1 overflow-y-auto px-4 pb-8 pt-4">
        {userEmail && <div className="mb-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-extrabold text-primary-foreground">{initial}</div>
          <div className="min-w-0"><p className="truncate text-sm font-bold text-foreground">{userEmail}</p><p className="text-xs text-muted-foreground">Conta ativa • {recordCount} registros</p></div>
        </div>}

        <div className="space-y-4">
          <Section title="Aparência e preferências">
            <SettingRow icon={dark ? Moon : Sun} title="Tema" description={dark ? 'Modo escuro ativo' : 'Modo claro ativo'}><Toggle checked={dark} onChange={() => onToggleDark()} label="Alternar tema" /></SettingRow>
            <div>
              <SettingRow icon={Type} title="Tamanho da fonte" description={FONT_LABELS[fontScale]} onClick={() => setFontOpen((v) => !v)}>
                <ChevronDown className={`size-4 text-muted-foreground transition ${fontOpen ? 'rotate-180' : ''}`} />
              </SettingRow>
              {fontOpen && <div className="border-t border-border bg-background/60 px-4 py-3">
                <div className="flex items-center gap-3"><button onClick={() => stepFont(-1)} disabled={fontIndex === 0} className="flex size-8 items-center justify-center rounded-full border border-border disabled:opacity-30"><Minus className="size-4" /></button><span className="text-xs font-bold text-muted-foreground">A</span><input type="range" min="0" max={FONT_ORDER.length - 1} value={fontIndex} onChange={(e) => onChangeFontScale(FONT_ORDER[Number(e.target.value)])} className="flex-1 accent-primary" /><span className="text-lg font-bold">A</span><button onClick={() => stepFont(1)} disabled={fontIndex === FONT_ORDER.length - 1} className="flex size-8 items-center justify-center rounded-full border border-border disabled:opacity-30"><Plus className="size-4" /></button></div>
              </div>}
            </div>
            <SettingRow icon={Languages} title="Idioma" description="Português (Brasil)" onClick={onOpenLanguage} />
            <SettingRow icon={Bell} title="Notificações" description="Som, aviso e destaque dos agendamentos"><Toggle checked={appSettings.notificationsEnabled} onChange={(v) => onChangeSetting('notificationsEnabled', v)} label="Ativar notificações" /></SettingRow>
            <SettingRow icon={Sparkles} title="Pular tela inicial" description="Não mostrar a apresentação ao abrir"><Toggle checked={appSettings.skipOnboarding} onChange={(v) => onChangeSetting('skipOnboarding', v)} label="Pular tela inicial" /></SettingRow>
            <SettingRow icon={ClipboardPaste} title="Colagem inteligente" description="Reconhece telefone e placa ao colar texto"><Toggle checked={appSettings.smartPaste} onChange={(v) => onChangeSetting('smartPaste', v)} label="Ativar colagem inteligente" /></SettingRow>
          </Section>

          <Section title="Novos registros e calendário">
            <SettingRow icon={RotateCcw} title="Categoria padrão" description="Pré-selecionada ao criar um serviço">
              <select aria-label="Categoria padrão" value={appSettings.defaultCategory ?? ''} onChange={(e) => onChangeSetting('defaultCategory', (e.target.value || null) as ServiceCategory | null)} className="max-w-[145px] rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground outline-none">
                <option value="">Nenhuma</option>{CATEGORY_ORDER.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
            </SettingRow>
            <SettingRow icon={CalendarDays} title="Formato de data" description="Como as datas aparecem no aplicativo">
              <select aria-label="Formato de data" value={appSettings.dateFormat} onChange={(e) => onChangeSetting('dateFormat', e.target.value as AppSettings['dateFormat'])} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground outline-none"><option value="dd/mm/yyyy">DD/MM/AAAA</option><option value="mm/dd/yyyy">MM/DD/AAAA</option></select>
            </SettingRow>
            <SettingRow icon={CalendarDays} title="Primeiro dia da semana" description="Organização do calendário">
              <select aria-label="Primeiro dia da semana" value={appSettings.weekStartDay} onChange={(e) => onChangeSetting('weekStartDay', e.target.value as AppSettings['weekStartDay'])} className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground outline-none"><option value="sunday">Domingo</option><option value="monday">Segunda-feira</option></select>
            </SettingRow>
          </Section>

          <Section title="Segurança e progresso">
            <div>
              <SettingRow icon={pinEnabled ? ShieldCheck : LockKeyhole} title="Bloqueio por PIN" description={pinEnabled ? 'PIN configurado e proteção ativa' : 'Proteja o aplicativo com 4 números'} onClick={() => pinEnabled ? setPinOpen((v) => !v) : onEnablePin()}>
                {pinEnabled ? <ChevronDown className={`size-4 text-muted-foreground transition ${pinOpen ? 'rotate-180' : ''}`} /> : <ChevronRight className="size-4 text-muted-foreground" />}
              </SettingRow>
              {pinEnabled && pinOpen && <div className="grid grid-cols-3 gap-2 border-t border-border bg-background/60 p-3"><button onClick={onLockNow} className="rounded-xl border border-border bg-card px-2 py-2 text-xs font-bold text-foreground">Bloquear agora</button><button onClick={onChangePin} className="rounded-xl border border-border bg-card px-2 py-2 text-xs font-bold text-foreground">Alterar PIN</button><button onClick={onDisablePin} className="rounded-xl border border-danger/30 bg-danger/5 px-2 py-2 text-xs font-bold text-danger">Remover PIN</button></div>}
            </div>
            <SettingRow icon={Trophy} title="Conquistas" description="Metas calculadas com seus dados reais" onClick={onOpenAchievements} />
          </Section>

          <Section title={`Dados e armazenamento • ${recordCount}`}>
            <div>
              <SettingRow icon={Database} title="Gerenciar dados" description="Backup, relatório, importação e manutenção" onClick={() => setDataOpen((v) => !v)}><ChevronDown className={`size-4 text-muted-foreground transition ${dataOpen ? 'rotate-180' : ''}`} /></SettingRow>
              {dataOpen && <div className="divide-y divide-border border-t border-border bg-background/35">
                <SettingRow icon={Download} title="Exportar backup" description="Baixar todos os registros em JSON" onClick={onExport} />
                <SettingRow icon={FileBarChart} title="Relatório em PDF" description="Gerar relatório consolidado" onClick={onExportReport} />
                <SettingRow icon={Upload} title="Importar backup" description="Restaurar registros de um arquivo JSON" onClick={() => fileRef.current?.click()} />
                <SettingRow icon={Zap} title={optimizing ? 'Otimizando fotos...' : 'Otimizar fotos antigas'} description="Reduz peso de imagens antigas" onClick={optimizing ? undefined : onOptimizePhotos} />
                <SettingRow icon={Trash2} title="Apagar todos os registros" description="Ação permanente e irreversível" onClick={onClearAll} danger />
              </div>}
            </div>
          </Section>

          <Section title="Conta">
            <SettingRow icon={LogOut} title="Sair da conta" description="Encerrar a sessão neste dispositivo" onClick={onLogout} danger />
          </Section>
        </div>
      </div>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) onImport(file); e.target.value = '' }} />
    </aside>
  </>
}
