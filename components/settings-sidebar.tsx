'use client'

import { useRef, useState } from 'react'
import {
  ChevronDown,
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

  const fontIndex = FONT_ORDER.indexOf(fontScale)

  function stepFont(delta: number) {
    const next = Math.min(FONT_ORDER.length - 1, Math.max(0, fontIndex + delta))
    onChangeFontScale(FONT_ORDER[next])
  }

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

        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-4">
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <User className="size-3.5" /> Conta
            </h3>
            <div className="space-y-2">
              {userEmail && (
                <p className="truncate rounded-lg border border-border bg-background px-3 py-3 text-sm font-medium text-foreground">
                  {userEmail}
                </p>
              )}
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 font-semibold text-foreground"
              >
                <LogOut className="size-4 text-primary" /> Sair da conta
              </button>
            </div>
          </section>

          {/* Aparência: apenas o ícone (lua = escuro, sol = claro) alterna o modo */}
          <section className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Aparência</h3>
            <button
              onClick={onToggleDark}
              aria-label={dark ? 'Ativar modo claro' : 'Ativar modo escuro'}
              title={dark ? 'Modo escuro ativo' : 'Modo claro ativo'}
              className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition hover:bg-primary/20 active:scale-95"
            >
              {dark ? <Moon className="size-5" /> : <Sun className="size-5" />}
            </button>
          </section>

          {/* Tamanho da fonte: barra tradicional, esquerda diminui / direita aumenta */}
          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Type className="size-3.5" /> Tamanho da fonte
            </h3>
            <div className="rounded-lg border border-border bg-background px-3 py-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">{FONT_LABELS[fontScale]}</span>
                <div className="flex items-center gap-1.5">
                  <button
                    aria-label="Diminuir fonte"
                    disabled={fontIndex === 0}
                    onClick={() => stepFont(-1)}
                    className="flex size-6 items-center justify-center rounded-full border border-border text-foreground transition disabled:opacity-30"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <button
                    aria-label="Aumentar fonte"
                    disabled={fontIndex === FONT_ORDER.length - 1}
                    onClick={() => stepFont(1)}
                    className="flex size-6 items-center justify-center rounded-full border border-border text-foreground transition disabled:opacity-30"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          </section>

          {/* Dados: ícone abre uma cascata (accordion) com as opções */}
          <section>
            <button
              onClick={() => setDataOpen((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-3"
            >
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <Database className="size-3.5 text-primary" /> Dados ({recordCount})
              </span>
              <ChevronDown
                className={`size-4 text-muted-foreground transition-transform duration-200 ${dataOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {dataOpen && (
              <div className="animate-slide-in mt-2 space-y-2">
                <button
                  onClick={onExport}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 font-semibold text-foreground"
                >
                  <Download className="size-4 text-primary" /> Exportar backup (JSON)
                </button>
                <button
                  onClick={onExportReport}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 font-semibold text-foreground"
                >
                  <FileBarChart className="size-4 text-primary" /> Exportar relatório (PDF)
                </button>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 font-semibold text-foreground"
                >
                  <Upload className="size-4 text-primary" /> Importar backup
                </button>
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
                <button
                  onClick={onOptimizePhotos}
                  disabled={optimizing}
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 font-semibold text-foreground disabled:opacity-60"
                >
                  <Zap className="size-4 text-primary" />
                  {optimizing ? 'Otimizando fotos...' : 'Otimizar fotos antigas (app mais rápido)'}
                </button>
                <button
                  onClick={onClearAll}
                  className="flex w-full items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-3 font-semibold text-danger"
                >
                  <Trash2 className="size-4" /> Apagar tudo
                </button>
              </div>
            )}
          </section>

          <section>
            <button
              onClick={onShowTutorial}
              className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 font-semibold text-foreground"
            >
              <HelpCircle className="size-4 text-primary" /> Ver tutorial novamente
            </button>
          </section>

          <p className="flex items-center justify-center gap-1.5 pt-2 text-center text-xs text-muted-foreground">
            Autoserviços • Dados sincronizados na nuvem
          </p>
          <a
            href={`https://wa.me/${DEVELOPER_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 pb-2 text-xs font-medium text-muted-foreground transition hover:text-primary"
          >
            Desenvolvido por Jonathan Santiago
            <svg viewBox="0 0 24 24" className="size-4 fill-[#25D366]" aria-hidden="true">
              <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.5 1.34 5.02L2 22l5.14-1.35A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.15c-1.56 0-3.09-.42-4.42-1.21l-.32-.19-3.05.8.82-2.97-.21-.31A8.15 8.15 0 0 1 3.85 12c0-4.5 3.66-8.15 8.19-8.15S20.23 7.5 20.23 12s-3.66 8.15-8.19 8.15zm4.48-6.13c-.25-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.04 0 1.2.88 2.36 1 2.53.12.16 1.74 2.65 4.21 3.72.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
            </svg>
          </a>
        </div>
      </aside>
    </>
  )
}
