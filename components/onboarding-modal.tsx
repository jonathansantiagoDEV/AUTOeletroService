'use client'

import { useState } from 'react'
import { Camera, Cloud, FileText, X } from 'lucide-react'

interface OnboardingModalProps {
  open: boolean
  onClose: () => void
}

const SLIDES = [
  {
    icon: Camera,
    title: 'Registre com a câmera',
    text: 'Toque no ícone de câmera para tirar uma foto e já iniciar um novo registro de serviço na hora.',
  },
  {
    icon: FileText,
    title: 'Compartilhe orçamentos em PDF',
    text: 'Cada registro pode ser exportado como PDF, prontinho para enviar ao cliente pelo WhatsApp.',
  },
  {
    icon: Cloud,
    title: 'Seus dados na nuvem',
    text: 'Tudo o que você salva fica sincronizado automaticamente na nuvem, protegido pela sua conta de login.',
  },
]

export function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  if (!open) return null

  const isLast = step === SLIDES.length - 1
  const Slide = SLIDES[step]
  const Icon = Slide.icon

  return (
    <div className="fixed inset-0 z-[4000] flex h-[100dvh] items-center justify-center bg-black/60 p-4">
      <div className="animate-fade-up w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="mb-2 ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-background"
        >
          <X className="size-4" />
        </button>

        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-8" />
        </div>

        <h2 className="mb-2 text-lg font-extrabold text-foreground">{Slide.title}</h2>
        <p className="mb-6 text-sm text-muted-foreground">{Slide.text}</p>

        <div className="mb-5 flex justify-center gap-1.5">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border'}`}
            />
          ))}
        </div>

        <button
          onClick={() => (isLast ? onClose() : setStep((s) => s + 1))}
          className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground transition hover:bg-primary-dark"
        >
          {isLast ? 'Começar a usar' : 'Próximo'}
        </button>
      </div>
    </div>
  )
}
