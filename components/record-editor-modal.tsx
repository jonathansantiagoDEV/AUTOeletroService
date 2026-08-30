'use client'

import { useEffect, useRef, useState } from 'react'
import { Bold, Camera, Italic, Palette, Type, Underline, X } from 'lucide-react'
import type { ServiceRecord, TextStyle } from '@/lib/types'
import { DEFAULT_TEXT_STYLE } from '@/lib/types'
import { generateId as genId } from '@/lib/storage'
import { useToast } from './toast'

const FONTS = ['Inter', 'Georgia', 'Courier New', 'Brush Script MT', 'Arial', 'Times New Roman']
const COLORS = ['#1A1A1A', '#8B1A1A', '#2E7D32', '#1565C0', '#F57C00', '#6A1B9A', '#C2185B', '#00838F']

interface RecordEditorModalProps {
  open: boolean
  editing: ServiceRecord | null
  initialPhotos?: string[]
  onClose: () => void
  onSave: (record: ServiceRecord) => void
}

export function RecordEditorModal({ open, editing, initialPhotos, onClose, onSave }: RecordEditorModalProps) {
  const showToast = useToast()
  const [clientName, setClientName] = useState('')
  const [plate, setPlate] = useState('')
  const [price, setPrice] = useState('')
  const [noteText, setNoteText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [style, setStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE)
  const [showFonts, setShowFonts] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setClientName(editing.clientName)
      setPlate(editing.plate)
      setPrice(editing.price)
      setNoteText(editing.noteText)
      setPhotos(editing.photos)
      setStyle(editing.textStyle ?? DEFAULT_TEXT_STYLE)
    } else {
      setClientName('')
      setPlate('')
      setPrice('')
      setNoteText('')
      setPhotos(initialPhotos && initialPhotos.length > 0 ? initialPhotos : [])
      setStyle(DEFAULT_TEXT_STYLE)
    }
    setShowFonts(false)
    setShowColors(false)
  }, [open, editing, initialPhotos])

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result
        if (typeof result === 'string') {
          setPhotos((prev) => [...prev, result])
        }
      }
      reader.readAsDataURL(file)
    })
  }

  function handleSave() {
    if (!clientName.trim() && !noteText.trim() && photos.length === 0) {
      showToast('❌ Preencha ao menos o nome ou a descrição', 'error')
      return
    }
    const record: ServiceRecord = {
      id: editing?.id ?? genId(),
      clientName: clientName.trim(),
      plate: plate.trim().toUpperCase(),
      price: price.trim(),
      noteText: noteText.trim(),
      photos,
      textStyle: style,
      schedule: editing?.schedule ?? null,
      scheduleTime: editing?.scheduleTime ?? null,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    }
    onSave(record)
  }

  if (!open) return null

  const editorStyle: React.CSSProperties = {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    color: style.color,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.isBold ? 700 : 400,
    fontStyle: style.isItalic ? 'italic' : 'normal',
    textDecoration: style.isUnderline ? 'underline' : 'none',
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="animate-fade-up flex max-h-[92vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-2xl bg-card sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-border bg-primary px-4 py-3 text-primary-foreground">
          <h2 className="text-lg font-bold">{editing ? 'Editar registro' : 'Novo registro'}</h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 hover:bg-white/20">
            <X className="size-5" />
          </button>
        </div>

        <div className="thin-scroll flex-1 space-y-3 overflow-y-auto p-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome do cliente"
              className="col-span-1 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary sm:col-span-2"
            />
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Placa"
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-base uppercase text-foreground outline-none focus:border-primary"
            />
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Preço (R$)"
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Barra de estilo */}
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-border bg-background p-1.5">
            <button
              onClick={() => {
                setShowFonts((v) => !v)
                setShowColors(false)
              }}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-sm font-semibold text-foreground hover:bg-card"
            >
              <Type className="size-4" /> Fonte
            </button>
            <button
              onClick={() => setStyle((s) => ({ ...s, isBold: !s.isBold }))}
              className={`rounded-md p-1.5 ${style.isBold ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-card'}`}
              aria-label="Negrito"
            >
              <Bold className="size-4" />
            </button>
            <button
              onClick={() => setStyle((s) => ({ ...s, isItalic: !s.isItalic }))}
              className={`rounded-md p-1.5 ${style.isItalic ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-card'}`}
              aria-label="Itálico"
            >
              <Italic className="size-4" />
            </button>
            <button
              onClick={() => setStyle((s) => ({ ...s, isUnderline: !s.isUnderline }))}
              className={`rounded-md p-1.5 ${style.isUnderline ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-card'}`}
              aria-label="Sublinhado"
            >
              <Underline className="size-4" />
            </button>
            <button
              onClick={() => {
                setShowColors((v) => !v)
                setShowFonts(false)
              }}
              className="rounded-md p-1.5 text-foreground hover:bg-card"
              aria-label="Cor"
            >
              <Palette className="size-4" />
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setStyle((s) => ({ ...s, fontSize: Math.max(12, s.fontSize - 2) }))}
                className="size-7 rounded-md text-foreground hover:bg-card"
                aria-label="Diminuir fonte"
              >
                A-
              </button>
              <span className="w-6 text-center text-sm text-muted-foreground">{style.fontSize}</span>
              <button
                onClick={() => setStyle((s) => ({ ...s, fontSize: Math.min(40, s.fontSize + 2) }))}
                className="size-7 rounded-md text-foreground hover:bg-card"
                aria-label="Aumentar fonte"
              >
                A+
              </button>
            </div>
          </div>

          {showFonts && (
            <div className="flex flex-wrap gap-1.5">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onClick={() => setStyle((s) => ({ ...s, fontFamily: f }))}
                  style={{ fontFamily: `'${f}', sans-serif` }}
                  className={`rounded-md border px-2.5 py-1 text-sm ${
                    style.fontFamily === f
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-foreground'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}

          {showColors && (
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setStyle((s) => ({ ...s, color: c }))}
                  style={{ background: c }}
                  className={`size-8 rounded-full border-2 ${style.color === c ? 'border-primary ring-2 ring-primary/40' : 'border-border'}`}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          )}

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Descrição do serviço..."
            rows={4}
            style={editorStyle}
            className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-primary"
          />

          {/* Fotos */}
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={p || '/placeholder.svg'} alt={`Foto ${i + 1}`} className="size-16 rounded-lg border border-border object-cover" />
                <button
                  onClick={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-danger text-white"
                  aria-label="Remover foto"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
            >
              <Camera className="size-5" />
              <span className="text-[10px]">Foto</span>
            </button>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>
        </div>

        <div className="flex gap-2 border-t border-border p-3">
          <button onClick={onClose} className="flex-1 rounded-lg border border-border bg-background py-3 font-semibold text-foreground">
            Cancelar
          </button>
          <button onClick={handleSave} className="flex-[2] rounded-lg bg-primary py-3 font-bold text-primary-foreground hover:bg-primary-dark">
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
