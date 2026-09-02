'use client'

import { useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileBarChart,
  HelpCircle,
  LogOut,
  Minus,
  Moon,
  Plus,
  Sun,
  Trash2,
  Type,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react'
import type { FontScale } from '@/lib/types'

const DEVELOPER_WHATSAPP = '5571993239156'

interface SettingsSidebarProps {
  open: boolean
  onClose: () => void
  dark: boolean
  onToggleDark: () => void
  fontScale: FontScale
  onChangeFontScale: (scale: FontScale) => void
  recordCount: number
  onExport: () => void
  onExportReport: () => void
  onImport: (file: File) => void
  onClearAll: () => void
  userEmail: string | null
  onLogout: () => void
  onShowTutorial: () => void
  onOptimizePhotos: () => void
  optimizing: boolean
}

const FONT_ORDER: FontScale[] = ['normal', 'medium', 'large', 'xlarge']
const FONT_LABELS: Record<FontScale, string> = {
  normal: 'Normal',
  medium: 'Média',
  large: 'Grande',
  xlarge: 'Extra grande',
}

// Uma "linha" dentro de um card de configurações: ícone com fundo colorido + rótulo + conteúdo à direita
function Row({
  icon: Icon,
  label,
  onClick,
  trailing,
  danger,
  iconBg,
}: {
  icon: React.ElementType
  label: string
  onClick?: () => void
  trailing?: React.ReactNode
  danger?: boolean
  iconBg?: string
}) {
  const content = (
    <div className="flex w-full items-center gap-3 px-3.5 py-3 text-left">
      <div
        className="flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: danger ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : (iconBg ?? 'color-mix(in srgb, var(--primary) 12%, transparent)'),
          color: danger ? 'var(--danger)' : 'var(--primary)',
        }}
      >
        <Icon className="size-4" />
      </div>
      <span className={`flex-1 text-sm font-semibold ${danger ? 'text-danger' : 'text-foreground'}`}>{label}</span>
      {trailing}
    </div>
  )
  if (!onClick) return content
  return (
    <button onClick={onClick} className="w-full transition active:bg-black/5 dark:active:bg-white/5">
      {content}
    </button>
  )
}

function Divider() {
  return <div className="ml-[46px] h-px bg-border" />
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-background">{children}</div>
}

export function SettingsSidebar({
  open,
  onClose,
  dark,
  onToggleDark,
  fontScale,
  onChangeFontScale,
  recordCount,
  onExport,
  onExportReport,
  onImport,
  onClearAll,
  userEmail,
  onLogout,
  onShowTutorial,
  onOptimizePhotos,
  optimizing,
}: SettingsSidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [dataOpen, setDataOpen] = useState(false)
  const [fontOpen, setFontOpen] = useState(false)

  const fontIndex = FONT_ORDER.indexOf(fontScale)

  function stepFont(delta: number) {
    const next = Math.min(FONT_ORDER.length - 1, Math.max(0, fontIndex + delta))
    onChangeFontScale(FONT_ORDER[next])
  }

  const initial = (userEmail || '?').trim().charAt(0).toUpperCase()

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[5500] bg-black/50 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        className={`fixed right-0 top-0 z-[6000] flex h-full w-[300px] max-w-[85%] flex-col bg-card shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground">
          <h2 className="text-lg font-bold">Configurações</h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>

        <div className="thin-scroll flex-1 space-y-4 overflow-y-auto p-4">
          {/* Perfil */}
          {userEmail && (
            <div className="flex items-center gap-3 px-1">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-base font-bold text-primary-foreground">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{userEmail}</p>
                <p className="text-xs text-muted-foreground">Conta ativa</p>
              </div>
            </div>
          )}

          {/* Preferências */}
          <Card>
            <Row
              icon={dark ? Moon : Sun}
              label="Aparência"
              onClick={onToggleDark}
              trailing={
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                  {dark ? 'Escuro' : 'Claro'}
                </span>
              }
            />
            <Divider />
            <Row
              icon={Type}
              label="Tamanho da fonte"
              onClick={() => setFontOpen((v) => !v)}
              trailing={
                <span className="flex items-center gap-1 text-xs font-bold text-muted-foreground">
                  {FONT_LABELS[fontScale]}
                  <ChevronDown className={`size-3.5 transition-transform ${fontOpen ? 'rotate-180' : ''}`} />
                </span>
              }
            />
            {fontOpen && (
              <div className="animate-slide-in border-t border-border px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <button
                    aria-label="Diminuir fonte"
                    disabled={fontIndex === 0}
                    onClick={() => stepFont(-1)}
                    className="flex size-7 items-center justify-center rounded-full border border-border text-foreground transition disabled:opacity-30"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="text-xs font-bold text-muted-foreground">A</span>
                  <input
                    type="range"
                    min={0}
                    max={FONT_ORDER.length - 1}
                    step={1}
                    value={fontIndex}
                    onChange={(e) => onChangeFontScale(FONT_ORDER[Number(e.target.value)])}
                    className="h-1.5 flex-1 accent-primary"
                    aria-label="Tamanho da fonte"
                  />
                  <span className="text-lg font-bold text-foreground">A</span>
                  <button
                    aria-label="Aumentar fonte"
                    disabled={fontIndex === FONT_ORDER.length - 1}
                    onClick={() => stepFont(1)}
                    className="flex size-7 items-center justify-center rounded-full border border-border text-foreground transition disabled:opacity-30"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
            )}
          </Card>

          {/* Dados */}
          <Card>
            <Row
              icon={Database}
              label={`Dados (${recordCount})`}
              onClick={() => setDataOpen((v) => !v)}
              trailing={<ChevronDown className={`size-4 text-muted-foreground transition-transform ${dataOpen ? 'rotate-180' : ''}`} />}
            />
            {dataOpen && (
              <div className="animate-slide-in border-t border-border">
                <Row icon={Download} label="Exportar backup (JSON)" onClick={onExport} trailing={<ChevronRight className="size-4 text-muted-foreground" />} />
                <Divider />
                <Row icon={FileBarChart} label="Exportar relatório (PDF)" onClick={onExportReport} trailing={<ChevronRight className="size-4 text-muted-foreground" />} />
                <Divider />
                <Row icon={Upload} label="Importar backup" onClick={() => fileRef.current?.click()} trailing={<ChevronRight className="size-4 text-muted-foreground" />} />
                <input
                  ref={fileRef}
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) onImport(f)
                    e.target.value = ''
                  }}
                />
                <Divider />
                <Row
                  icon={Zap}
                  label={optimizing ? 'Otimizando fotos...' : 'Otimizar fotos antigas'}
                  onClick={onOptimizePhotos}
                  trailing={!optimizing && <ChevronRight className="size-4 text-muted-foreground" />}
                />
                <Divider />
                <Row icon={Trash2} label="Apagar tudo" onClick={onClearAll} danger />
              </div>
            )}
          </Card>

          {/* Ajuda e conta */}
          <Card>
            <Row icon={HelpCircle} label="Ver tutorial novamente" onClick={onShowTutorial} trailing={<ChevronRight className="size-4 text-muted-foreground" />} />
            <Divider />
            <Row icon={LogOut} label="Sair da conta" onClick={onLogout} trailing={<ChevronRight className="size-4 text-muted-foreground" />} />
          </Card>

          <div className="space-y-1 pt-1 text-center">
            <p className="text-xs text-muted-foreground">Autoserviços • Dados sincronizados na nuvem</p>
            <a
              href={`https://wa.me/${DEVELOPER_WHATSAPP}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 pb-1 text-xs font-medium text-muted-foreground transition hover:text-primary"
            >
              Desenvolvido por Jonathan Santiago
              <svg viewBox="0 0 24 24" className="size-4 fill-[#25D366]" aria-hidden="true">
                <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.5 1.34 5.02L2 22l5.14-1.35A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.15c-1.56 0-3.09-.42-4.42-1.21l-.32-.19-3.05.8.82-2.97-.21-.31A8.15 8.15 0 0 1 3.85 12c0-4.5 3.66-8.15 8.19-8.15S20.23 7.5 20.23 12s-3.66 8.15-8.19 8.15zm4.48-6.13c-.25-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.04 0 1.2.88 2.36 1 2.53.12.16 1.74 2.65 4.21 3.72.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
              </svg>
            </a>
          </div>
        </div>
      </aside>
    </>
  )
}
