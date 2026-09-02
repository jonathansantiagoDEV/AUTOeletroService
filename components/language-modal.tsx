'use client'

import { Check, Languages, X } from 'lucide-react'
import type { AppLanguage } from '@/lib/types'

interface LanguageModalProps { open: boolean; value: AppLanguage; onChange: (value: AppLanguage) => void; onClose: () => void }

export function LanguageModal({ open, value, onChange, onClose }: LanguageModalProps) {
  if (!open) return null
  return <div onClick={onClose} className="fixed inset-0 z-[7500] flex items-end justify-center bg-black/50 sm:items-center">
    <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[440px] rounded-t-3xl bg-card p-4 sm:rounded-3xl">
      <div className="mb-4 flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Languages className="size-5" /></div><div className="flex-1"><h2 className="font-extrabold text-foreground">Idioma</h2><p className="text-xs text-muted-foreground">Idioma da interface do aplicativo.</p></div><button onClick={onClose} className="rounded-full p-2 text-muted-foreground"><X className="size-5" /></button></div>
      <button onClick={() => { onChange('pt-BR'); onClose() }} className="flex w-full items-center gap-3 rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 text-left"><span className="text-2xl">🇧🇷</span><div className="flex-1"><p className="font-bold text-foreground">Português (Brasil)</p><p className="text-xs text-muted-foreground">Idioma disponível nesta versão</p></div>{value === 'pt-BR' && <Check className="size-5 text-primary" />}</button>
      <p className="mt-3 px-1 text-xs text-muted-foreground">A estrutura está pronta para receber outros idiomas em versões futuras.</p>
    </div>
  </div>
}
