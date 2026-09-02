'use client'

import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  initial?: { x: number; y: number }
  onClick?: () => void
  className?: string
}

export default function DraggableFloatingButton({ children, initial = { x: 20, y: 0 }, onClick, className = '' }: Props) {
  const [pos, setPos] = useState(initial)
  const [drag, setDrag] = useState(false)
  const [returning, setReturning] = useState(false)
  const start = useRef({ x: 0, y: 0 })
  const timer = useRef<NodeJS.Timeout | null>(null)
  const returnTimer = useRef<NodeJS.Timeout | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
      if (returnTimer.current) clearTimeout(returnTimer.current)
    }
  }, [])

  const scheduleReturn = () => {
    if (returnTimer.current) clearTimeout(returnTimer.current)
    returnTimer.current = setTimeout(() => {
      setReturning(true)
      setPos(initial)
    }, 5000)
  }

  return <button
    className={`fixed z-50 touch-none ${drag ? 'scale-110 cursor-grabbing' : returning ? 'transition-all duration-500' : ''} ${className}`}
    style={{ left: pos.x, top: pos.y }}
    onTransitionEnd={() => setReturning(false)}
    onPointerDown={(e) => {
      moved.current = false
      if (returnTimer.current) clearTimeout(returnTimer.current)
      setReturning(false)
      start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
      timer.current = setTimeout(() => {
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
