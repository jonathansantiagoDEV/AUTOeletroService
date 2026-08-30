'use client'

import { createContext, useCallback, useContext, useState } from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastState {
  msg: string
  type: ToastType
  visible: boolean
}

const ToastContext = createContext<(msg: string, type?: ToastType) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({ msg: '', type: 'success', visible: false })

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    setToast({ msg, type, visible: true })
    window.clearTimeout((showToast as unknown as { _t?: number })._t)
    ;(showToast as unknown as { _t?: number })._t = window.setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      3200,
    )
  }, [])

  const borderColor =
    toast.type === 'success'
      ? 'var(--success)'
      : toast.type === 'error'
        ? 'var(--danger)'
        : '#1565c0'

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        role="status"
        aria-live="polite"
        onClick={() => setToast((t) => ({ ...t, visible: false }))}
        className={`fixed bottom-20 left-1/2 z-[9999] max-w-[90%] -translate-x-1/2 cursor-pointer rounded-xl border border-border bg-card px-6 py-3 text-center text-base text-foreground shadow-[0_4px_30px_rgba(0,0,0,0.2)] transition-all duration-300 ${
          toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        }`}
        style={{ borderLeft: `4px solid ${borderColor}` }}
      >
        {toast.msg}
      </div>
    </ToastContext.Provider>
  )
}
