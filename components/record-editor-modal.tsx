'use client'

import { useEffect, useRef, useState } from 'react'
import { Bold, Camera, Image as GalleryIcon, Italic, Palette, PenLine, Type, Underline, X } from 'lucide-react'
import type { ServiceCategory, ServiceRecord, ServiceStatus, TextStyle } from '@/lib/types'
import { CATEGORY_LABELS, CATEGORY_ORDER, DEFAULT_TEXT_STYLE, STATUS_COLORS, STATUS_LABELS } from '@/lib/types'
import { generateId as genId } from '@/lib/storage'
import { normalizeImageOrientation } from '@/lib/image'
import { uploadPhoto, deletePhoto } from '@/lib/supabase/storage'
import { SignaturePad } from './signature-pad'
import { useToast } from './toast'

const FONTS = ['Inter', 'Georgia', 'Courier New', 'Brush Script MT', 'Arial', 'Times New Roman']
const COLORS = ['#1A1A1A', '#8B1A1A', '#2E7D32', '#1565C0', '#F57C00', '#6A1B9A', '#C2185B', '#00838F']

// Aceita placa antiga (ABC1234) e Mercosul (ABC1D23)
function isValidPlate(value: string): boolean {
  const antiga = /^[A-Z]{3}[0-9]{4}$/
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/
  return antiga.test(value) || mercosul.test(value)
}

interface RecordEditorModalProps {
  open: boolean
  editing: ServiceRecord | null
  initialPhotos?: string[]
  userId: string | null
  onClose: () => void
  onSave: (record: ServiceRecord) => Promise<boolean> | void
}

export function RecordEditorModal({ open, editing, initialPhotos, userId, onClose, onSave }: RecordEditorModalProps) {
  const showToast = useToast()
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [plate, setPlate] = useState('')
  const [price, setPrice] = useState('')
  const [noteText, setNoteText] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [uploadingCount, setUploadingCount] = useState(0)
  const [style, setStyle] = useState<TextStyle>(DEFAULT_TEXT_STYLE)
  const [status, setStatus] = useState<ServiceStatus>('em_andamento')
  const [category, setCategory] = useState<ServiceCategory | null>(null)
  const [signature, setSignature] = useState<string | null>(null)
  const [warrantyUntil, setWarrantyUntil] = useState<string | null>(null)
  const [signatureOpen, setSignatureOpen] = useState(false)
  const [showFonts, setShowFonts] = useState(false)
  const [showColors, setShowColors] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    if (editing) {
      setClientName(editing.clientName)
      setClientPhone(editing.clientPhone ?? '')
      setPlate(editing.plate)
      setPrice(editing.price)
      setNoteText(editing.noteText)
      setPhotos(editing.photos)
      setStyle(editing.textStyle ?? DEFAULT_TEXT_STYLE)
      setStatus(editing.status ?? 'em_andamento')
      setCategory(editing.category ?? null)
      setSignature(editing.signature ?? null)
      setWarrantyUntil(editing.warrantyUntil ?? null)
    } else {
      setClientName('')
      setClientPhone('')
      setPlate('')
      setPrice('')
      setNoteText('')
      setPhotos([])
      setStyle(DEFAULT_TEXT_STYLE)
      setStatus('em_andamento')
      setCategory(null)
      setSignature(null)
      setWarrantyUntil(null)
      // Fotos vindas do botão de câmera rápida (fora do editor) ainda estão em base64 —
      // envia para o Storage aqui, do mesmo jeito que as fotos escolhidas dentro do editor.
      if (initialPhotos && initialPhotos.length > 0 && userId) {
        setUploadingCount((n) => n + initialPhotos.length)
        initialPhotos.forEach((dataUrl) => {
          uploadPhoto(dataUrl, userId)
            .then((url) => {
              if (url) {
                setPhotos((prev) => [...prev, url])
              } else {
                showToast('❌ Falha ao enviar uma foto', 'error')
              }
            })
            .finally(() => setUploadingCount((n) => Math.max(0, n - 1)))
        })
      }
    }
    setShowFonts(false)
    setShowColors(false)
    setSaving(false)
  }, [open, editing, initialPhotos, userId, showToast])

  function handleFiles(files: FileList | null) {
    if (!files) return
    if (!userId) {
      showToast('❌ Não foi possível identificar o usuário para enviar a foto', 'error')
      return
    }
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return
      setUploadingCount((n) => n + 1)
      normalizeImageOrientation(file)
        .then((dataUrl) => uploadPhoto(dataUrl, userId))
        .then((url) => {
          if (url) {
            setPhotos((prev) => [...prev, url])
          } else {
            showToast('❌ Falha ao enviar uma foto', 'error')
          }
        })
        .catch(() => {
          showToast('❌ Falha ao processar uma foto', 'error')
        })
        .finally(() => setUploadingCount((n) => Math.max(0, n - 1)))
    })
  }

  function handlePriceChange(raw: string) {
    // Mantém só dígitos e formata como moeda (R$ 0,00)
    const digits = raw.replace(/\D/g, '')
    if (!digits) {
      setPrice('')
      return
    }
    const cents = parseInt(digits, 10)
    const formatted = (cents / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    setPrice(formatted)
  }

  function handlePlateChange(raw: string) {
    // Remove tudo que não é letra/número, limita a 7 caracteres, maiúsculo
    const cleaned = raw
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 7)
    setPlate(cleaned)
  }

  function handlePhoneChange(raw: string) {
    // Formata como (XX) XXXXX-XXXX enquanto digita
    const digits = raw.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 2) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    if (digits.length > 7) formatted = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
    setClientPhone(formatted)
  }

  async function handleSave() {
    if (saving) return
    if (uploadingCount > 0) {
      showToast('⏳ Aguarde o envio das fotos terminar', 'error')
      return
    }
    if (!clientName.trim() && !noteText.trim() && photos.length === 0) {
      showToast('❌ Preencha ao menos o nome ou a descrição', 'error')
      return
    }
    if (plate.trim() && !isValidPlate(plate.trim())) {
      showToast('❌ Placa inválida. Use o formato ABC1234 ou ABC1D23', 'error')
      return
    }
    setSaving(true)
    const record: ServiceRecord = {
      id: editing?.id ?? genId(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      plate: plate.trim().toUpperCase(),
      price: price.trim(),
      noteText: noteText.trim(),
      photos,
      textStyle: style,
      schedule: editing?.schedule ?? null,
      scheduleTime: editing?.scheduleTime ?? null,
      status,
      category,
      signature,
      warrantyUntil,
      createdAt: editing?.createdAt ?? new Date().toISOString(),
    }
    const result = await onSave(record)
    // Se o salvamento falhou, destrava o botão para o usuário tentar de novo.
    if (result === false) {
      setSaving(false)
    }
  }

  if (!open) return null

  // Se o usuário não escolheu uma cor customizada (ainda está na cor padrão),
  // deixamos a cor seguir o tema (claro/escuro) via classe CSS, em vez de
  // travar em #1A1A1A — que fica ilegível sobre fundo escuro. Se o usuário
  // escolher uma cor no seletor de cores, essa escolha é sempre respeitada.
  const usingDefaultColor = style.color === DEFAULT_TEXT_STYLE.color
  const editorStyle: React.CSSProperties = {
    fontFamily: `'${style.fontFamily}', sans-serif`,
    color: usingDefaultColor ? undefined : style.color,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.isBold ? 700 : 400,
    fontStyle: style.isItalic ? 'italic' : 'normal',
    textDecoration: style.isUnderline ? 'underline' : 'none',
  }

  return (
    <div className="fixed inset-0 z-[3000] flex h-[100dvh] items-center justify-center bg-black/50 p-4">
      <div className="animate-fade-up flex max-h-[80dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl bg-card">
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
              value={clientPhone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              inputMode="numeric"
              placeholder="Telefone (opcional)"
              maxLength={16}
              className="col-span-1 rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary sm:col-span-2"
            />
            <input
              value={plate}
              onChange={(e) => handlePlateChange(e.target.value)}
              placeholder="Placa (ABC1234 ou ABC1D23)"
              maxLength={7}
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-base uppercase text-foreground outline-none focus:border-primary"
            />
            <input
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              inputMode="numeric"
              placeholder="Preço (R$)"
              className="rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground outline-none focus:border-primary"
            />
          </div>

          {/* Status do serviço */}
          <div className="flex gap-1.5">
            {(Object.keys(STATUS_LABELS) as ServiceStatus[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className="flex-1 rounded-full border py-1.5 text-xs font-semibold transition"
                style={
                  status === key
                    ? { backgroundColor: STATUS_COLORS[key], borderColor: STATUS_COLORS[key], color: '#fff' }
                    : { borderColor: 'var(--border)', color: 'var(--muted-foreground)' }
                }
              >
                {STATUS_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Categoria do serviço */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ORDER.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory((c) => (c === key ? null : key))}
                className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                  category === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground'
                }`}
              >
                {CATEGORY_LABELS[key]}
              </button>
            ))}
          </div>

          {/* Garantia do serviço */}
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5">
            <span className="whitespace-nowrap text-sm font-semibold text-muted-foreground">Garantia até</span>
            <input
              type="date"
              value={warrantyUntil ?? ''}
              onChange={(e) => setWarrantyUntil(e.target.value || null)}
              className="flex-1 bg-transparent text-base text-foreground outline-none"
            />
            {warrantyUntil && (
              <button
                type="button"
                onClick={() => setWarrantyUntil(null)}
                className="rounded-full p-1 text-muted-foreground hover:text-danger"
                aria-label="Remover garantia"
              >
                <X className="size-4" />
              </button>
            )}
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
            className={`w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 outline-none focus:border-primary ${
              usingDefaultColor ? 'text-foreground' : ''
            }`}
          />

          {/* Fotos */}
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                <img src={p || '/placeholder.svg'} alt={`Foto ${i + 1}`} className="size-16 rounded-lg border border-border object-cover" />
                <button
                  onClick={() => {
                    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                    deletePhoto(p)
                  }}
                  className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-danger text-white"
                  aria-label="Remover foto"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
            {uploadingCount > 0 &&
              Array.from({ length: uploadingCount }).map((_, i) => (
                <div
                  key={`uploading-${i}`}
                  className="flex size-16 items-center justify-center rounded-lg border border-dashed border-border bg-background"
                >
                  <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ))}
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
            >
              <Camera className="size-5" />
              <span className="text-[10px]">Câmera</span>
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex size-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed border-primary/50 text-primary hover:bg-primary/5"
            >
              <GalleryIcon className="size-5" />
              <span className="text-[10px]">Galeria</span>
            </button>
            {/* capture="environment" abre a câmera do dispositivo diretamente (em vez da galeria) */}
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </div>

          {/* Assinatura do cliente */}
          <div className="rounded-lg border border-border bg-background p-2.5">
            {signature ? (
              <div className="flex items-center gap-3">
                <img src={signature} alt="Assinatura do cliente" className="h-12 w-24 rounded border border-border bg-white object-contain" />
                <div className="flex flex-1 flex-col gap-1.5">
                  <span className="text-xs font-semibold text-success">Assinatura coletada</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSignatureOpen(true)}
                      className="text-xs font-semibold text-primary underline"
                    >
                      Refazer
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignature(null)}
                      className="text-xs font-semibold text-danger underline"
                    >
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignatureOpen(true)}
                className="flex w-full items-center justify-center gap-2 py-1 text-sm font-semibold text-primary"
              >
                <PenLine className="size-4" /> Coletar assinatura do cliente
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 border-t border-border p-3">
          <button onClick={onClose} disabled={saving} className="flex-1 rounded-lg border border-border bg-background py-3 font-semibold text-foreground disabled:opacity-50">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploadingCount > 0}
            className="flex-[2] rounded-lg bg-primary py-3 font-bold text-primary-foreground hover:bg-primary-dark disabled:opacity-60"
          >
            {saving ? 'Salvando...' : uploadingCount > 0 ? 'Enviando fotos...' : 'Salvar'}
          </button>
        </div>
      </div>
      <SignaturePad
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSave={(dataUrl) => {
          setSignature(dataUrl)
          setSignatureOpen(false)
        }}
      />
    </div>
  )
}
