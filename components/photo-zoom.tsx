'use client'

import { X } from 'lucide-react'

export function PhotoZoom({ photo, onClose }: { photo: string | null; onClose: () => void }) {
  if (!photo) return null
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/90 p-4"
    >
      <button
        aria-label="Fechar"
        onClick={onClose}
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
      >
        <X className="size-6" />
      </button>
      <img
        src={photo || '/placeholder.svg'}
        alt="Foto ampliada"
        onClick={(e) => e.stopPropagation()}
        className="animate-zoom-in max-h-[90vh] max-w-full rounded-lg object-contain"
      />
    </div>
  )
}
