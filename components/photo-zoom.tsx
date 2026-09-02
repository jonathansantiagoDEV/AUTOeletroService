'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PhotoZoomProps {
  photos: string[]
  initialIndex: number
  onClose: () => void
}

// Visualizador de fotos em tela cheia com:
// - Deslizar (swipe) entre todas as fotos do registro
// - Zoom por pinça no celular (dois dedos) e pela roda do mouse no desktop
// - Duplo toque/clique para alternar entre 1x e 2.5x
// - Arrastar a imagem quando estiver ampliada
export function PhotoZoom({ photos, initialIndex, onClose }: PhotoZoomProps) {
  const [index, setIndex] = useState(initialIndex)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map())
  const pinchStartDist = useRef(0)
  const pinchStartScale = useRef(1)
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const translateStart = useRef({ x: 0, y: 0 })
  const lastTapTime = useRef(0)
  const swipeStartX = useRef<number | null>(null)

  useEffect(() => {
    setIndex(initialIndex)
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [initialIndex, photos])

  useEffect(() => {
    // Reseta o zoom sempre que a foto exibida muda (troca por deslizar/setas)
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [index])

  if (photos.length === 0) return null

  const clampScale = (s: number) => Math.min(4, Math.max(1, s))

  function distanceBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  function goTo(newIndex: number) {
    if (newIndex < 0 || newIndex >= photos.length) return
    setIndex(newIndex)
  }

  function handlePointerDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      pinchStartDist.current = distanceBetween(pts[0], pts[1])
      pinchStartScale.current = scale
      swipeStartX.current = null
    } else if (pointers.current.size === 1) {
      if (scale > 1) {
        dragStart.current = { x: e.clientX, y: e.clientY }
        translateStart.current = translate
      } else {
        swipeStartX.current = e.clientX
      }
    }
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values())
      const dist = distanceBetween(pts[0], pts[1])
      if (pinchStartDist.current > 0) {
        const next = clampScale((dist / pinchStartDist.current) * pinchStartScale.current)
        setScale(next)
      }
    } else if (pointers.current.size === 1 && scale > 1 && dragStart.current) {
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      setTranslate({ x: translateStart.current.x + dx, y: translateStart.current.y + dy })
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    // Deslizar para trocar de foto (só quando não está ampliado)
    if (
      pointers.current.size === 1 &&
      swipeStartX.current !== null &&
      scale === 1
    ) {
      const dx = e.clientX - swipeStartX.current
      if (Math.abs(dx) > 60) {
        if (dx < 0) goTo(index + 1)
        else goTo(index - 1)
      }
    }
    pointers.current.delete(e.pointerId)
    if (pointers.current.size < 2) {
      pinchStartDist.current = 0
    }
    if (pointers.current.size === 0) {
      dragStart.current = null
      swipeStartX.current = null
      // Se soltou com zoom quase normal, encaixa de volta em 1x
      if (scale < 1.05) {
        setScale(1)
        setTranslate({ x: 0, y: 0 })
      }
    }
  }

  function handleDoubleTap(e: React.MouseEvent | React.PointerEvent) {
    if (scale > 1) {
      setScale(1)
      setTranslate({ x: 0, y: 0 })
    } else {
      setScale(2.5)
    }
  }

  function handleClickCapture(e: React.MouseEvent) {
    const now = Date.now()
    if (now - lastTapTime.current < 300) {
      handleDoubleTap(e)
    }
    lastTapTime.current = now
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    const next = clampScale(scale - e.deltaY * 0.0015 * scale)
    setScale(next)
    if (next <= 1) setTranslate({ x: 0, y: 0 })
  }

  return (
    <div
      className="fixed inset-0 z-[5000] flex flex-col bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget && scale === 1) onClose()
      }}
    >
      <div className="flex items-center justify-between p-4">
        {photos.length > 1 ? (
          <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
            {index + 1}/{photos.length}
          </span>
        ) : (
          <span />
        )}
        <button
          aria-label="Fechar"
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <X className="size-6" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative flex flex-1 touch-none items-center justify-center overflow-hidden select-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onClickCapture={handleClickCapture}
      >
        <img
          ref={imgRef}
          src={photos[index] || '/placeholder.svg'}
          alt={`Foto ${index + 1}`}
          draggable={false}
          className="max-h-[85vh] max-w-full rounded-lg object-contain transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
            cursor: scale > 1 ? 'grab' : 'default',
          }}
        />

        {photos.length > 1 && scale === 1 && (
          <>
            {index > 0 && (
              <button
                aria-label="Foto anterior"
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(index - 1)
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft className="size-6" />
              </button>
            )}
            {index < photos.length - 1 && (
              <button
                aria-label="Próxima foto"
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(index + 1)
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight className="size-6" />
              </button>
            )}
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 pb-4">
          {photos.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      <p className="pb-4 text-center text-xs text-white/50">
        {scale > 1 ? 'Arraste para mover · toque duas vezes para voltar' : 'Deslize para ver mais fotos · toque duas vezes para ampliar'}
      </p>
    </div>
  )
}
