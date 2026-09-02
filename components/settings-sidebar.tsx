'use client'

import { useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  FileBarChart,
  LogOut,
  Minus,
  Moon,
  Plus,
  Sun,
  Trash2,
  Type,
  Upload,
  X,
  Zap,
} from 'lucide-react'
import type { FontScale } from '@/lib/types'

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

// Uma linha "só ícone": botão de largura total com o ícone centralizado, sem rótulo de texto.
// Usada para ações compactas onde o texto é redundante (ex.: alternar tema, sair da conta).
function IconRow({
  icon: Icon,
  onClick,
  danger,
  ariaLabel,
}: {
  icon: React.ElementType
  onClick: () => void
  danger?: boolean
  ariaLabel: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      title={ariaLabel}
      className="flex w-full items-center justify-center py-3 transition active:bg-black/5 dark:active:bg-white/5"
    >
      <div
        className="flex size-8 items-center justify-center rounded-lg"
        style={{
          backgroundColor: danger ? 'color-mix(in srgb, var(--danger) 15%, transparent)' : 'color-mix(in srgb, var(--primary) 12%, transparent)',
          color: danger ? 'var(--danger)' : 'var(--primary)',
        }}
      >
        <Icon className="size-4" />
      </div>
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
        // Segunda camada de segurança: mesmo com a fonte agora isolada do
        // layout (ver globals.css), o botão de fechar da sidebar continua
        // fixo em px/16px para garantir que o usuário sempre consiga sair
        // das Configurações, não importa o que aconteça no resto do app.
        style={{ width: 'min(300px, 85vw)', fontSize: '16px' }}
        className={`fixed right-0 top-0 z-[6000] flex h-full flex-col bg-card shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground">
          <h2 className="text-lg font-bold">Configurações</h2>
          <button
            aria-label="Fechar"
            onClick={onClose}
            style={{ minWidth: '36px', minHeight: '36px' }}
            className="flex shrink-0 items-center justify-center rounded-full p-1 hover:bg-white/20"
          >
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
            <IconRow
              icon={dark ? Moon : Sun}
              onClick={onToggleDark}
              ariaLabel={dark ? 'Tema escuro ativo — tocar para mudar para claro' : 'Tema claro ativo — tocar para mudar para escuro'}
            />
            <Divider />
            <Row
              icon={Type}
              label="Fonte"
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

          {/* Conta */}
          <Card>
            <IconRow icon={LogOut} onClick={onLogout} danger ariaLabel="Sair da conta" />
          </Card>
        </div>
      </aside>
    </>
  )
}
