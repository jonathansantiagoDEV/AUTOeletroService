'use client'

import { BarChart3, CalendarClock, CalendarDays, ChevronRight, Settings, X } from 'lucide-react'

const DEVELOPER_WHATSAPP = '5571993239156'

interface MainMenuProps {
  open: boolean
  onClose: () => void
  calendarActive: boolean
  scheduledCount: number
  pendingCount: number
  onToggleCalendar: () => void
  onOpenAgenda: () => void
  onOpenDashboard: () => void
  onOpenSettings: () => void
}

// Linha de navegação de largura total: ícone com fundo colorido + rótulo +
// pontinho vermelho (quando há pendências) + seta. Mesmo padrão visual das
// Configurações, pra manter o menu consistente com o resto do app.
function MenuItem({
  icon: Icon,
  label,
  active,
  hasBadge,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
  hasBadge?: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-3.5 py-3 text-left transition active:bg-black/5 dark:active:bg-white/5 ${
        active ? 'bg-primary/10' : ''
      }`}
    >
      <div
        className="relative flex size-8 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          color: 'var(--primary)',
        }}
      >
        <Icon className="size-4" />
        {hasBadge && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-card bg-primary" />}
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </button>
  )
}

function Divider() {
  return <div className="ml-[46px] h-px bg-border" />
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-2xl border border-border bg-background">{children}</div>
}

export function MainMenu({
  open,
  onClose,
  calendarActive,
  scheduledCount,
  pendingCount,
  onToggleCalendar,
  onOpenAgenda,
  onOpenDashboard,
  onOpenSettings,
}: MainMenuProps) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-[5500] bg-black/50 transition-opacity ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />
      <aside
        style={{ width: 'min(300px, 85vw)', fontSize: '16px' }}
        className={`fixed left-0 top-0 z-[6000] flex h-full flex-col bg-card shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between bg-primary px-4 py-4 text-primary-foreground">
          <h2 className="text-lg font-bold">Menu</h2>
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
          <div>
            <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-primary">Agenda</p>
            <Card>
              <MenuItem
                icon={CalendarDays}
                label="Calendário"
                active={calendarActive}
                hasBadge={scheduledCount > 0}
                onClick={() => {
                  onToggleCalendar()
                  onClose()
                }}
              />
              <Divider />
              <MenuItem
                icon={CalendarClock}
                label="Agendamentos"
                hasBadge={pendingCount > 0}
                onClick={() => {
                  onOpenAgenda()
                  onClose()
                }}
              />
            </Card>
          </div>

          <div>
            <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-primary">Visão geral</p>
            <Card>
              <MenuItem
                icon={BarChart3}
                label="Dashboard"
                onClick={() => {
                  onOpenDashboard()
                  onClose()
                }}
              />
            </Card>
          </div>

          <div>
            <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-primary">Sistema</p>
            <Card>
              <MenuItem
                icon={Settings}
                label="Configurações"
                onClick={() => {
                  onOpenSettings()
                  onClose()
                }}
              />
            </Card>
          </div>
        </div>

        <div
          className="space-y-2.5 border-t border-border px-4 pt-4 text-center"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 22px)' }}
        >
          <p className="text-xs text-muted-foreground">Autoserviços • Dados sincronizados na nuvem</p>
          <a
            href={`https://wa.me/${DEVELOPER_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-wrap items-center justify-center gap-2 text-lg font-bold leading-snug text-primary transition hover:opacity-80"
          >
            Desenvolvido por Jonathan Santiago
            <svg viewBox="0 0 24 24" className="size-7 shrink-0 fill-[#25D366]" aria-hidden="true">
              <path d="M12.04 2c-5.52 0-10 4.48-10 10 0 1.77.46 3.5 1.34 5.02L2 22l5.14-1.35A9.96 9.96 0 0 0 12.04 22c5.52 0 10-4.48 10-10s-4.48-10-10-10zm0 18.15c-1.56 0-3.09-.42-4.42-1.21l-.32-.19-3.05.8.82-2.97-.21-.31A8.15 8.15 0 0 1 3.85 12c0-4.5 3.66-8.15 8.19-8.15S20.23 7.5 20.23 12s-3.66 8.15-8.19 8.15zm4.48-6.13c-.25-.12-1.44-.71-1.66-.79-.22-.08-.39-.12-.55.12-.16.25-.63.79-.78.95-.14.16-.29.18-.53.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.42-.55-.42h-.47c-.16 0-.43.06-.65.31-.22.25-.86.84-.86 2.04 0 1.2.88 2.36 1 2.53.12.16 1.74 2.65 4.21 3.72.59.25 1.05.4 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.44-.59 1.64-1.16.2-.57.2-1.06.14-1.16-.06-.1-.22-.16-.47-.28z" />
            </svg>
          </a>
        </div>
      </aside>
    </>
  )
}
