'use client'

import { BadgeCheck, CheckCircle2, CircleDollarSign, Sparkles, Trophy, UserRound, Wrench, X } from 'lucide-react'
import type { AchievementProgress } from '@/lib/types'

interface AchievementsScreenProps { open: boolean; achievements: AchievementProgress[]; onClose: () => void }

const ICONS = { spark: Sparkles, service: Wrench, check: CheckCircle2, client: UserRound, value: CircleDollarSign }

export function AchievementsScreen({ open, achievements, onClose }: AchievementsScreenProps) {
  if (!open) return null
  const unlocked = achievements.filter((a) => a.unlocked).length
  const totalPercent = achievements.length ? Math.round((unlocked / achievements.length) * 100) : 0

  return <div className="fixed inset-0 z-[8000] flex justify-center bg-background">
    <div className="flex h-full w-full max-w-[480px] flex-col bg-background">
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Trophy className="size-5" /></div>
        <div className="flex-1"><h2 className="text-lg font-extrabold text-foreground">Conquistas</h2><p className="text-xs text-muted-foreground">Seu progresso é calculado pelos registros reais.</p></div>
        <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-background"><X className="size-5" /></button>
      </header>
      <main className="thin-scroll flex-1 overflow-y-auto p-4">
        <div className="mb-4 rounded-2xl bg-primary p-4 text-primary-foreground">
          <div className="flex items-end justify-between"><div><p className="text-xs font-semibold text-white/70">PROGRESSO GERAL</p><p className="mt-1 text-2xl font-extrabold">{unlocked} de {achievements.length}</p></div><span className="text-2xl font-extrabold">{totalPercent}%</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ width: `${totalPercent}%` }} /></div>
        </div>
        <div className="space-y-3">
          {achievements.map((a) => { const Icon = ICONS[a.icon]; const percent = Math.min(100, Math.round((a.current / a.target) * 100)); return <div key={a.id} className={`rounded-2xl border p-4 ${a.unlocked ? 'border-primary/35 bg-primary/5' : 'border-border bg-card'}`}>
            <div className="flex gap-3"><div className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${a.unlocked ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'}`}>{a.unlocked ? <BadgeCheck className="size-5" /> : <Icon className="size-5" />}</div><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><h3 className="font-bold text-foreground">{a.title}</h3><span className="text-xs font-bold text-muted-foreground">{Math.min(a.current,a.target).toLocaleString('pt-BR')}/{a.target.toLocaleString('pt-BR')}</span></div><p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} /></div></div></div>
          </div>})}
        </div>
      </main>
    </div>
  </div>
}
