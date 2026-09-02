'use client'

import { BarChart3, CalendarClock, CalendarDays, Settings, X } from 'lucide-react'

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

// Item de navegação do menu: ícone com fundo colorido + rótulo + badge opcional
function MenuItem({
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ElementType
  label: string
  active?: boolean
  badge?: number
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[0.98] ${
        active ? 'border-primary bg-primary/10' : 'border-border bg-background'
      }`}
    >
      <div
        className="relative flex size-9 shrink-0 items-center justify-center rounded-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--primary) 12%, transparent)',
          color: 'var(--primary)',
        }}
      >
        <Icon className="size-4.5" />
        {!!badge && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
            {badge}
          </span>
        )}
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
    </button>
  )
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

        <div className="thin-scroll flex-1 space-y-2 overflow-y-auto p-4">
          <MenuItem
            icon={CalendarDays}
            label="Calendário"
            active={calendarActive}
            badge={scheduledCount}
            onClick={() => {
              onToggleCalendar()
              onClose()
            }}
          />
          <MenuItem
            icon={CalendarClock}
            label="Agendamentos"
            badge={pendingCount}
            onClick={() => {
              onOpenAgenda()
              onClose()
            }}
          />
          <MenuItem
            icon={BarChart3}
            label="Dashboard"
            onClick={() => {
              onOpenDashboard()
              onClose()
            }}
          />
          <MenuItem
            icon={Settings}
            label="Configurações"
            onClick={() => {
              onOpenSettings()
              onClose()
            }}
          />
        </div>
      </aside>
    </>
  )
}
