import { jsPDF } from 'jspdf'
import type { ServiceRecord } from './types'

export function generatePDFBlob(record: ServiceRecord): Blob {
  const doc = new jsPDF('p', 'mm', 'a4')

  // Cabeçalho
  doc.setFillColor(139, 26, 26)
  doc.rect(0, 0, 210, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('AUTOSERVICOS', 105, 18, { align: 'center' })
  doc.setTextColor(200, 200, 200)
  doc.setFontSize(10)
  doc.text('Documento de Servico', 105, 26, { align: 'center' })
  doc.setDrawColor(139, 26, 26)
  doc.setLineWidth(0.5)
  doc.line(20, 35, 190, 35)

  doc.setTextColor(50, 50, 50)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  let y = 45
  const margin = 20
  const lineHeight = 8

  doc.text('DADOS DO CLIENTE', margin, y)
  y += lineHeight + 2
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.text('Cliente: ' + (record.clientName || '---'), margin, y)
  y += lineHeight
  doc.text('Placa: ' + (record.plate || '---'), margin, y)
  y += lineHeight
  doc.text('Preco: ' + (record.price || '---'), margin, y)
  y += lineHeight
  if (record.schedule) {
    doc.text(
      'Agendamento: ' +
        new Date(record.schedule + 'T00:00:00').toLocaleDateString('pt-BR') +
        ' as ' +
        (record.scheduleTime || '--:--'),
      margin,
      y,
    )
    y += lineHeight
  }
  const dateObj = new Date(record.createdAt)
  doc.text(
    'Criado em: ' +
      dateObj.toLocaleDateString('pt-BR') +
      ' as ' +
      dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    margin,
    y,
  )
  y += lineHeight + 4

  doc.setFont('helvetica', 'bold')
  doc.text('DESCRICAO DO SERVICO:', margin, y)
  y += lineHeight
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const textLines = doc.splitTextToSize(record.noteText || 'Sem descricao', 170)
  doc.text(textLines, margin, y)
  y += textLines.length * 5 + 4

  const photos = record.photos || []
  if (photos.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('FOTOS DO SERVICO:', margin, y)
    y += lineHeight + 2
    doc.setFont('helvetica', 'normal')
    let xPos = margin
    let photoIndex = 0
    const maxPhotosPerRow = 3
    const imgWidth = 50
    const imgHeight = 40
    for (let i = 0; i < Math.min(photos.length, 6); i++) {
      try {
        const photo = photos[i]
        if (photo && typeof photo === 'string' && photo.length > 100) {
          if (y + imgHeight > 280) {
            doc.addPage()
            y = 20
            xPos = margin
            photoIndex = 0
          }
          doc.addImage(photo, 'JPEG', xPos, y, imgWidth, imgHeight)
          xPos += imgWidth + 5
          photoIndex++
          if (photoIndex >= maxPhotosPerRow) {
            photoIndex = 0
            xPos = margin
            y += imgHeight + 5
          }
        }
      } catch {
        // ignora imagem inválida
      }
    }
    if (photos.length > 6) {
      y += 5
      doc.setFontSize(8)
      doc.text('+ ' + (photos.length - 6) + ' fotos adicionais', margin, y)
    }
    y += 10
  }

  if (y > 280) {
    doc.addPage()
    y = 20
  }
  doc.setDrawColor(200, 200, 200)
  doc.line(20, y + 10, 190, y + 10)
  y += 16
  doc.setFontSize(9)
  doc.setTextColor(150, 150, 150)
  doc.text('Documento gerado pelo Autoservicos', 105, y, { align: 'center' })

  return doc.output('blob')
}

export function pdfFileName(record: ServiceRecord): string {
  return 'servico_' + (record.clientName || 'registro').replace(/\s/g, '_') + '.pdf'
}
