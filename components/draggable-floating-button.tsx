'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  initial?: { x: number; y: number }
  onClick?: () => void
  className?: string
  /** Enquanto true (ex.: um modal aberto), pausa a contagem dos 5s de retorno. */
  paused?: boolean
}

export default function DraggableFloatingButton({ children, initial = { x: 20, y: 0 }, onClick, className = '', paused = false }: Props) {
  const [pos, setPos] = useState(initial)
  const [drag, setDrag] = useState(false)
  const [returning, setReturning] = useState(false)
  const start = useRef({ x: 0, y: 0 })
  const timer = useRef<NodeJS.Timeout | null>(null)
  const returnTimer = useRef<NodeJS.Timeout | null>(null)
  const moved = useRef(false)
  // true quando o botão está fora do lugar original e ainda "deve" um retorno
  const awaitingReturn = useRef(false)
  // true enquanto a aba/página está em segundo plano (ex.: câmera nativa do
  // celular aberta por cima do app) — nesses momentos o navegador pode até
  // congelar os timers, então tratamos como pausa também
  const [pageHidden, setPageHidden] = useState(false)
  const effectivePaused = paused || pageHidden

  useEffect(() => {
    const onVisibility = () => setPageHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (returnTimer.current) clearTimeout(returnTimer.current)
    }
  }, [])

  const doReturn = () => {
    awaitingReturn.current = false
    returnTimer.current = null
    setReturning(true)
    setPos(initial)
  }

  const scheduleReturn = () => {
    awaitingReturn.current = true
    if (returnTimer.current) clearTimeout(returnTimer.current)
    if (effectivePaused) return // não conta enquanto pausado (modal aberto ou app em 2º plano)
    returnTimer.current = setTimeout(doReturn, 5000)
  }

  // Quando a pausa muda: se acabou de pausar (modal abriu / app foi para 2º
  // plano), congela a contagem. Se acabou de despausar e o botão ainda está
  // fora do lugar, começa a contar os 5s a partir de agora.
  useEffect(() => {
    if (effectivePaused) {
      if (returnTimer.current) {
        clearTimeout(returnTimer.current)
        returnTimer.current = null
      }
    } else if (awaitingReturn.current && !returnTimer.current) {
      returnTimer.current = setTimeout(doReturn, 5000)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectivePaused, initial.x, initial.y])

  return <button
    className={`fixed z-50 touch-none ${drag ? 'scale-110 cursor-grabbing' : returning ? 'transition-all duration-500' : ''} ${className}`}
    style={{ left: pos.x, top: pos.y }}
    onTransitionEnd={() => setReturning(false)}
    onPointerDown={(e) => {
      moved.current = false
      start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
      timer.current = setTimeout(() => {
        // Só cancela o retorno automático quando um arraste de verdade começa
        // (long-press de 1s). Um toque rápido no botão (ex.: abrir a câmera)
        // não deve mexer no agendamento de retorno à posição inicial.
        if (returnTimer.current) clearTimeout(returnTimer.current)
        setReturning(false)
        setDrag(true)
        navigator.vibrate?.(25)
        ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
      }, 1000)
    }}
    onPointerMove={(e) => {
      if (!drag) return
      moved.current = true
      setPos({ x: Math.max(8, e.clientX - start.current.x), y: Math.max(8, e.clientY - start.current.y) })
    }}
    onPointerUp={() => {
      if (timer.current) clearTimeout(timer.current)
      if (drag) {
        setDrag(false)
        scheduleReturn()
      }
      if (!drag && !moved.current) onClick?.()
    }}
    onPointerCancel={() => {
      if (timer.current) clearTimeout(timer.current)
    }}
  >{children}</button>
}
