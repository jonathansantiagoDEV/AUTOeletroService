'use client'

import { useEffect, useState } from 'react'
import { Delete, LockKeyhole, ShieldCheck, X } from 'lucide-react'

interface PinPadProps {
  open: boolean
  mode: 'unlock' | 'create' | 'verify'
  title?: string
  subtitle?: string
  error?: string | null
  onSubmit: (pin: string) => void | Promise<void>
  onCancel?: () => void
}

export function PinPad({ open, mode, title, subtitle, error, onSubmit, onCancel }: PinPadProps) {
  const [pin, setPin] = useState('')
  const [firstPin, setFirstPin] = useState<string | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setPin('')
    setFirstPin(null)
    setLocalError(null)
  }, [open, mode])

  if (!open) return null

  const creatingConfirmation = mode === 'create' && firstPin !== null
  const heading = title ?? (mode === 'create' ? (creatingConfirmation ? 'Confirme seu PIN' : 'Crie um PIN') : mode === 'verify' ? 'Confirme seu PIN' : 'Aplicativo bloqueado')
  const helper = subtitle ?? (mode === 'create' ? (creatingConfirmation ? 'Digite novamente os 4 números.' : 'Escolha 4 números para proteger o aplicativo.') : 'Digite seu PIN de 4 números para continuar.')

  function press(value: string) {
    setLocalError(null)
    if (pin.length >= 4) return
    const next = pin + value
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => submit(next), 100)
    }
  }

  function submit(value = pin) {
    if (value.length !== 4) return
    if (mode === 'create') {
      if (!firstPin) {
        setFirstPin(value)
        setPin('')
        return
      }
      if (firstPin !== value) {
        setLocalError('Os PINs não conferem. Tente novamente.')
        setFirstPin(null)
        setPin('')
        return
      }
    }
    onSubmit(value)
    setPin('')
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-background p-5">
      <div className="w-full max-w-[360px] text-center">
        {onCancel && mode !== 'unlock' && (
          <button onClick={onCancel} aria-label="Cancelar" className="absolute right-5 top-5 rounded-full border border-border p-2 text-muted-foreground">
            <X className="size-5" />
          </button>
        )}
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          {mode === 'create' && creatingConfirmation ? <ShieldCheck className="size-8" /> : <LockKeyhole className="size-8" />}
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">{heading}</h1>
        <p className="mx-auto mt-2 max-w-[290px] text-sm text-muted-foreground">{helper}</p>

        <div className={`my-7 flex justify-center gap-4 ${(error || localError) ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((i) => <span key={i} className={`size-3 rounded-full border-2 border-primary ${i < pin.length ? 'bg-primary' : 'bg-transparent'}`} />)}
        </div>
        {(error || localError) && <p className="-mt-4 mb-4 text-sm font-semibold text-danger">{error || localError}</p>}

        <div className="mx-auto grid max-w-[290px] grid-cols-3 gap-3">
          {['1','2','3','4','5','6','7','8','9'].map((n) => (
            <button key={n} onClick={() => press(n)} className="aspect-square rounded-2xl border border-border bg-card text-2xl font-bold text-foreground shadow-sm transition active:scale-95 active:bg-primary/10">{n}</button>
          ))}
          <div />
          <button onClick={() => press('0')} className="aspect-square rounded-2xl border border-border bg-card text-2xl font-bold text-foreground shadow-sm transition active:scale-95 active:bg-primary/10">0</button>
          <button onClick={() => setPin((p) => p.slice(0, -1))} aria-label="Apagar número" className="aspect-square rounded-2xl text-muted-foreground transition active:bg-primary/10"><Delete className="mx-auto size-6" /></button>
        </div>
      </div>
    </div>
  )
}
