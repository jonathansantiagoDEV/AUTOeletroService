import { jsPDF } from 'jspdf'
import type { ServiceRecord } from './types'

const PRIMARY: [number, number, number] = [139, 26, 26] // #8B1A1A
const PRIMARY_DARK: [number, number, number] = [92, 14, 14] // #5C0E0E
const TEXT_DARK: [number, number, number] = [26, 26, 26]
const TEXT_MUTED: [number, number, number] = [110, 110, 110]
const LINE: [number, number, number] = [225, 225, 225]
const ROW_ALT: [number, number, number] = [247, 247, 247]

export function generatePDFBlob(record: ServiceRecord): Blob {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const margin = 20
  const contentWidth = pageWidth - margin * 2

  // ---------- Cabeçalho ----------
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageWidth, 8, 'F')
  // faixa diagonal decorativa (efeito "curvo" do modelo, feito com triângulo)
  doc.setFillColor(...PRIMARY_DARK)
  doc.triangle(pageWidth - 55, 0, pageWidth, 0, pageWidth, 40, 'F')

  doc.setTextColor(...PRIMARY)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDEM DE SERVIÇO', margin, 26)

  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dateObj = new Date(record.createdAt)
  doc.text('Nº ' + shortId(record.id) + '   |   Emitido em ' + dateObj.toLocaleDateString('pt-BR'), margin, 33)

  // logo/nome da oficina no canto (sobre a faixa diagonal)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('AUTOSERVIÇOS', pageWidth - margin, 20, { align: 'right' })

  let y = 52

  // ---------- Colunas: Oficina / Cliente ----------
  const col1X = margin
  const col2X = margin + contentWidth / 2 + 5

  doc.setTextColor(...PRIMARY)
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.text('AUTOSERVIÇOS', col1X, y)
  doc.text('CLIENTE:', col2X, y)

  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.6)
  doc.line(col1X, y + 1.5, col1X + 45, y + 1.5)
  doc.line(col2X, y + 1.5, col2X + 45, y + 1.5)

  y += 7
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  const clientLines = [
    record.clientName || '---',
    record.plate ? 'Placa: ' + record.plate : null,
    record.schedule
      ? 'Agendado: ' +
        new Date(record.schedule + 'T00:00:00').toLocaleDateString('pt-BR') +
        ' às ' +
        (record.scheduleTime || '--:--')
      : null,
  ].filter(Boolean) as string[]

  const oficinaLines = ['Documento de serviço', 'Gerado em ' + dateObj.toLocaleDateString('pt-BR')]

  const rowsCount = Math.max(clientLines.length, oficinaLines.length)
  for (let i = 0; i < rowsCount; i++) {
    if (oficinaLines[i]) doc.text(oficinaLines[i], col1X, y)
    if (clientLines[i]) doc.text(clientLines[i], col2X, y)
    y += 6
  }

  y += 6

  // ---------- Tabela: Serviço / Descrição / Valor ----------
  const tableX = margin
  const tableW = contentWidth
  const colService = tableW * 0.28
  const colDesc = tableW * 0.5
  const colValue = tableW * 0.22

  doc.setFillColor(...PRIMARY)
  doc.rect(tableX, y, tableW, 9, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.text('SERVIÇO', tableX + 3, y + 6)
  doc.text('DESCRIÇÃO', tableX + colService + 3, y + 6)
  doc.text('VALOR', tableX + colService + colDesc + colValue / 2, y + 6, { align: 'center' })
  y += 9

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  const descLines = doc.splitTextToSize(record.noteText || 'Sem descrição', colDesc - 6)
  const rowHeight = Math.max(14, descLines.length * 5 + 6)

  doc.setFillColor(...ROW_ALT)
  doc.rect(tableX, y, tableW, rowHeight, 'F')
  doc.setDrawColor(...LINE)
  doc.rect(tableX, y, tableW, rowHeight)

  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'bold')
  doc.text('Serviço automotivo', tableX + 3, y + 6)
  doc.setFont('helvetica', 'normal')
  doc.text(descLines, tableX + colService + 3, y + 6)
  doc.setFont('helvetica', 'bold')
  doc.text(record.price ? 'R$ ' + record.price : '---', tableX + colService + colDesc + colValue / 2, y + rowHeight / 2 + 1.5, {
    align: 'center',
  })
  y += rowHeight + 8

  // ---------- Total em destaque ----------
  doc.setFillColor(...PRIMARY)
  doc.rect(tableX, y, tableW, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('VALOR TOTAL: ' + (record.price ? 'R$ ' + record.price : '---'), tableX + tableW / 2, y + 8, {
    align: 'center',
  })
  y += 22

  // ---------- Fotos ----------
  const photos = record.photos || []
  if (photos.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setTextColor(...PRIMARY)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('FOTOS DO SERVIÇO', margin, y)
    doc.setDrawColor(...PRIMARY)
    doc.line(margin, y + 1.5, margin + 45, y + 1.5)
    y += 8

    doc.setFont('helvetica', 'normal')
    let xPos = margin
    let photoIndex = 0
    const maxPhotosPerRow = 3
    const boxWidth = 50
    const boxHeight = 40
    for (let i = 0; i < Math.min(photos.length, 6); i++) {
      try {
        const photo = photos[i]
        if (photo && typeof photo === 'string' && photo.length > 100) {
          if (y + boxHeight > 280) {
            doc.addPage()
            y = 20
            xPos = margin
            photoIndex = 0
          }
          let drawWidth = boxWidth
          let drawHeight = boxHeight
          let offsetX = 0
          let offsetY = 0
          try {
            const props = doc.getImageProperties(photo)
            const scale = Math.min(boxWidth / props.width, boxHeight / props.height)
            drawWidth = props.width * scale
            drawHeight = props.height * scale
            offsetX = (boxWidth - drawWidth) / 2
            offsetY = (boxHeight - drawHeight) / 2
          } catch {
            // se não conseguir ler as dimensões, usa a caixa cheia (comportamento antigo)
          }
          doc.setDrawColor(...LINE)
          doc.rect(xPos, y, boxWidth, boxHeight)
          doc.addImage(photo, 'JPEG', xPos + offsetX, y + offsetY, drawWidth, drawHeight)
          xPos += boxWidth + 5
          photoIndex++
          if (photoIndex >= maxPhotosPerRow) {
            photoIndex = 0
            xPos = margin
            y += boxHeight + 5
          }
        }
      } catch {
        // ignora imagem inválida
      }
    }
    if (photos.length > 6) {
      y += 5
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_MUTED)
      doc.text('+ ' + (photos.length - 6) + ' fotos adicionais', margin, y)
    }
    y += 10
  }

  // ---------- Rodapé ----------
  if (y > 280) {
    doc.addPage()
    y = 20
  }
  y = Math.max(y, 270)
  doc.setDrawColor(...LINE)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_MUTED)
  doc.setFont('helvetica', 'normal')
  doc.text('Documento gerado pelo Autoserviços', pageWidth / 2, y, { align: 'center' })

  return doc.output('blob')
}

function shortId(id: string): string {
  return (id || '').slice(-6).toUpperCase() || '000000'
}

export function pdfFileName(record: ServiceRecord): string {
  return 'servico_' + (record.clientName || 'registro').replace(/\s/g, '_') + '.pdf'
}
