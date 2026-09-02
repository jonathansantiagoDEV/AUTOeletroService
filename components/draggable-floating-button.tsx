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
  const start = useRef({ x: 0, y: 0 })
  const timer = useRef<NodeJS.Timeout | null>(null)
  const moved = useRef(false)

  useEffect(() => {
    if (!drag) return
    const t = setTimeout(() => setPos(initial), 5000)
    return () => clearTimeout(t)
  }, [pos, drag, initial.x, initial.y])

  return <button
    className={`fixed z-50 touch-none transition-all duration-500 ${drag ? 'scale-110 cursor-grabbing' : ''} ${className}`}
    style={{ left: pos.x, top: pos.y }}
    onPointerDown={(e) => {
      moved.current = false
      start.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
      timer.current = setTimeout(() => {
        setDrag(true)
        navigator.vibrate?.(25)
      }, 1000)
    }}
    onPointerMove={(e) => {
      if (!drag) return
      moved.current = true
      setPos({ x: Math.max(8, e.clientX - start.current.x), y: Math.max(8, e.clientY - start.current.y) })
    }}
    onPointerUp={() => {
      if (timer.current) clearTimeout(timer.current)
      if (!drag && !moved.current) onClick?.()
    }}
  >{children}</button>
}
