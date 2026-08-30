'use client'

import { useRef } from 'react'
import { Database, Download, LogOut, Moon, Sun, Trash2, Type, Upload, User, X } from 'lucide-react'
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
  onImport: (file: File) => void
  onClearAll: () => void
  userEmail: string | null
  onLogout: () => void
}

const FONT_OPTIONS: { value: FontScale; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'medium', label: 'Média' },
  { value: 'large', label: 'Grande' },
  { value: 'xlarge', label: 'Extra' },
]

export function SettingsSidebar({
  open,
  onClose,
  dark,
  onToggleDark,
  fontScale,
  onChangeFontScale,
  recordCount,
  onExport,
  onImport,
  onClearAll,
  userEmail,
  onLogout,
}: SettingsSidebarProps) {
  const fileRef = useRef<HTMLInputElement>(null)

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

          <section>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">Aparência</h3>
            <button
              onClick={onToggleDark}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-3 py-3 text-foreground"
            >
              <span className="flex items-center gap-2 font-semibold">
                {dark ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-primary" />}
                Modo escuro
              </span>
              <span className={`relative h-6 w-11 rounded-full transition ${dark ? 'bg-primary' : 'bg-border'}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${dark ? 'left-[22px]' : 'left-0.5'}`} />
              </span>
            </button>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Type className="size-3.5" /> Tamanho da fonte
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {FONT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => onChangeFontScale(o.value)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition ${
                    fontScale === o.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <Database className="size-3.5" /> Dados ({recordCount})
            </h3>
            <div className="space-y-2">
              <button
                onClick={onExport}
                className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-3 py-3 font-semibold text-foreground"
              >
                <Download className="size-4 text-primary" /> Exportar backup (JSON)
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
                onClick={onClearAll}
                className="flex w-full items-center gap-2 rounded-lg border border-danger/30 bg-danger/10 px-3 py-3 font-semibold text-danger"
              >
                <Trash2 className="size-4" /> Apagar tudo
              </button>
            </div>
          </section>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Autoserviços • Dados sincronizados na nuvem
          </p>
        </div>
      </aside>
    </>
  )
}
