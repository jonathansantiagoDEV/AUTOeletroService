'use client'

import { Download, Mail, MessageCircle, Share2, X } from 'lucide-react'
import type { ServiceRecord } from '@/lib/types'
import { generatePDFBlob, pdfFileName } from '@/lib/pdf'
import { useToast } from './toast'

interface ShareModalProps {
  record: ServiceRecord | null
  onClose: () => void
}

function buildMessage(record: ServiceRecord): string {
  const lines = [
    '*AUTOSERVIÇOS*',
    '',
    `*Cliente:* ${record.clientName || '---'}`,
  ]
  if (record.plate) lines.push(`*Placa:* ${record.plate}`)
  if (record.price) lines.push(`*Preço:* ${record.price}`)
  if (record.schedule) {
    lines.push(
      `*Agendamento:* ${new Date(record.schedule + 'T00:00:00').toLocaleDateString('pt-BR')} às ${record.scheduleTime || '--:--'}`,
    )
  }
  lines.push('', '*Descrição:*', record.noteText || 'Sem descrição')
  return lines.join('\n')
}

export function ShareModal({ record, onClose }: ShareModalProps) {
  const showToast = useToast()
  if (!record) return null

  function downloadPDF() {
    try {
      const blob = generatePDFBlob(record)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = pdfFileName(record)
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      showToast('✅ PDF baixado!', 'success')
      onClose()
    } catch {
      showToast('❌ Erro ao gerar PDF', 'error')
    }
  }

  async function shareWhatsApp() {
    // Tenta compartilhar o PDF de verdade primeiro (abre o WhatsApp já com o arquivo anexado).
    try {
      const blob = generatePDFBlob(record)
      const file = new File([blob], pdfFileName(record), { type: 'application/pdf' })
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'Autoserviços', text: buildMessage(record) })
        onClose()
        return
      }
    } catch {
      // usuário cancelou o compartilhamento do arquivo
      return
    }
    // Sem suporte a arquivo: baixa o PDF e abre o WhatsApp só com o texto,
    // para o usuário anexar o PDF manualmente na conversa.
    showToast('📄 PDF baixado! Anexe o arquivo na conversa do WhatsApp', 'info')
    downloadPDF()
    const text = encodeURIComponent(buildMessage(record))
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  function shareEmail() {
    const subject = encodeURIComponent(`Autoserviços - ${record.clientName || 'Documento'}`)
    const body = encodeURIComponent(buildMessage(record).replace(/\*/g, ''))
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    onClose()
  }

  async function shareSystem() {
    try {
      const blob = generatePDFBlob(record)
      const file = new File([blob], pdfFileName(record), { type: 'application/pdf' })
      const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean }
      if (nav.share && nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'Autoserviços', text: buildMessage(record) })
        onClose()
      } else {
        // O sistema não suporta compartilhar o arquivo PDF diretamente (comum em apps
        // empacotados). Baixamos o PDF para que o usuário anexe manualmente no WhatsApp.
        showToast('📄 PDF baixado! Anexe o arquivo na conversa do WhatsApp', 'info')
        downloadPDF()
      }
    } catch {
      // usuário cancelou
    }
  }

  const options = [
    { label: 'WhatsApp', icon: MessageCircle, action: shareWhatsApp, cls: 'bg-whatsapp text-white' },
    { label: 'E-mail', icon: Mail, action: shareEmail, cls: 'bg-primary text-primary-foreground' },
    { label: 'Compartilhar', icon: Share2, action: shareSystem, cls: 'bg-foreground text-background' },
    { label: 'Baixar PDF', icon: Download, action: downloadPDF, cls: 'border border-border bg-background text-foreground' },
  ]

  return (
    <div onClick={onClose} className="fixed inset-0 z-[4500] flex items-end justify-center bg-black/50 sm:items-center">
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up w-full max-w-[480px] rounded-t-2xl bg-card p-4 sm:rounded-2xl"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Compartilhar</h2>
          <button aria-label="Fechar" onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:bg-background">
            <X className="size-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {options.map((o) => (
            <button
              key={o.label}
              onClick={o.action}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-4 text-sm font-bold transition hover:opacity-90 ${o.cls}`}
            >
              <o.icon className="size-6" />
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
