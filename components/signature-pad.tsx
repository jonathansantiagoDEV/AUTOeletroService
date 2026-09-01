'use client'

import { useEffect, useRef, useState } from 'react'
import { Check, Eraser, X } from 'lucide-react'

interface SignaturePadProps {
  open: boolean
  onClose: () => void
  onSave: (dataUrl: string) => void
}

export function SignaturePad({ open, onClose, onSave }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    if (!open) return
    setHasDrawn(false)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Ajusta resolução do canvas ao tamanho real exibido (evita traço borrado)
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    ctx.scale(ratio, ratio)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1a1a1a'
  }, [open])

  function getPoint(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    drawingRef.current = true
    lastPointRef.current = getPoint(e)
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !lastPointRef.current) return
    const point = getPoint(e)
    ctx.beginPath()
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y)
    ctx.lineTo(point.x, point.y)
    ctx.stroke()
    lastPointRef.current = point
    setHasDrawn(true)
  }

  function endDraw() {
    drawingRef.current = false
    lastPointRef.current = null
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, rect.width, rect.height)
    setHasDrawn(false)
  }

  function confirm() {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) return
    onSave(canvas.toDataURL('image/png'))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/50 p-4">
      <div className="animate-fade-up w-full max-w-[420px] overflow-hidden rounded-2xl bg-card">
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="text-base font-bold">Assinatura do cliente</h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted-foreground">
            Peça para o cliente assinar abaixo confirmando o serviço ou a retirada do veículo.
          </p>
          <canvas
            ref={canvasRef}
            className="h-[180px] w-full touch-none rounded-lg border-2 border-dashed border-border bg-white"
            onPointerDown={startDraw}
            onPointerMove={draw}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
          />
        </div>
        <div className="flex gap-2 border-t border-border p-3">
          <button
            onClick={clear}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2.5 font-semibold text-foreground"
          >
            <Eraser className="size-4" /> Limpar
          </button>
          <button
            onClick={confirm}
            disabled={!hasDrawn}
            className="flex flex-[2] items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 font-bold text-primary-foreground disabled:opacity-50"
          >
            <Check className="size-4" /> Confirmar assinatura
          </button>
        </div>
      </div>
    </div>
  )
}
