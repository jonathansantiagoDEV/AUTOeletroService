import { jsPDF } from 'jspdf'
import type { ServiceRecord } from './types'
import { CATEGORY_LABELS, STATUS_LABELS } from './types'

// Cores baseadas no modelo (azul e laranja)
const PRIMARY: [number, number, number] = [0, 82, 155] // Azul #00529B
const PRIMARY_LIGHT: [number, number, number] = [0, 112, 201] // Azul claro
const ACCENT: [number, number, number] = [237, 116, 40] // Laranja #ED7428
const TEXT_DARK: [number, number, number] = [26, 26, 26]
const TEXT_MUTED: [number, number, number] = [110, 110, 110]
const LINE: [number, number, number] = [220, 220, 220]
const ROW_ALT: [number, number, number] = [248, 248, 248]

export function generatePDFBlob(record: ServiceRecord): Blob {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const margin = 18
  const contentWidth = pageWidth - margin * 2

  let y = 18

  // ============================================================
  // 1. CABEÇALHO - estilo "PACHECO & LACERDA"
  // ============================================================
  
  // Linha decorativa superior
  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageWidth, 5, 'F')
  
  // Faixa laranja decorativa (curva no canto direito)
  doc.setFillColor(...ACCENT)
  doc.triangle(pageWidth - 65, 0, pageWidth, 0, pageWidth, 38, 'F')
  
  // Nome da oficina (como "AUTOSERVIÇOS" no canto superior direito)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('AUTOSERVIÇOS', pageWidth - margin, 16, { align: 'right' })
  
  // Título: "ORDEM DE SERVIÇO" (como "ORÇAMENTO #01234")
  doc.setTextColor(...PRIMARY)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('ORDEM DE SERVIÇO', margin, 28)
  
  // Número do documento
  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const dateObj = new Date(record.createdAt)
  const dateStr = dateObj.toLocaleDateString('pt-BR')
  const idShort = (record.id || '').slice(-6).toUpperCase()
  doc.text(`Nº ${idShort}   |   Emitido em ${dateStr}`, margin, 36)

  y = 50

  // ============================================================
  // 2. INFORMAÇÕES - OFICINA x CLIENTE (lado a lado)
  // ============================================================
  
  const col1X = margin
  const col2X = margin + contentWidth / 2 + 6
  
  // --- Coluna 1: Oficina ---
  doc.setTextColor(...PRIMARY)
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.text('AUTOSERVIÇOS', col1X, y)
  
  // Linha separadora
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(col1X, y + 1.8, col1X + 40, y + 1.8)
  
  y += 7
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  
  const oficinaInfo = [
    'Documento de serviço',
    'Gerado em ' + dateStr,
    record.category ? `Categoria: ${CATEGORY_LABELS[record.category]}` : null,
    record.schedule ? `Agendado: ${new Date(record.schedule + 'T00:00:00').toLocaleDateString('pt-BR')} ${record.scheduleTime || ''}` : null,
    record.warrantyUntil ? `Garantia até: ${new Date(record.warrantyUntil + 'T00:00:00').toLocaleDateString('pt-BR')}` : null,
  ].filter(Boolean) as string[]
  
  oficinaInfo.forEach(line => {
    doc.text(line, col1X, y)
    y += 5.5
  })
  
  // Reset Y para a coluna 2
  y = 50
  
  // --- Coluna 2: Cliente ---
  doc.setTextColor(...PRIMARY)
  doc.setFontSize(10.5)
  doc.setFont('helvetica', 'bold')
  doc.text('CLIENTE:', col2X, y)
  
  doc.setDrawColor(...PRIMARY)
  doc.setLineWidth(0.5)
  doc.line(col2X, y + 1.8, col2X + 40, y + 1.8)
  
  y += 7
  doc.setTextColor(...TEXT_DARK)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  
  const clienteInfo = [
    record.clientName || '---',
    record.plate ? `Placa: ${record.plate}` : null,
  ].filter(Boolean) as string[]
  
  clienteInfo.forEach(line => {
    doc.text(line, col2X, y)
    y += 5.5
  })

  y = Math.max(65, y + 6)

  // ============================================================
  // 3. TABELA: SERVIÇO | DESCRIÇÃO | VALOR
  // ============================================================
  
  const tableX = margin
  const tableW = contentWidth
  const colService = tableW * 0.22
  const colDesc = tableW * 0.53
  const colValue = tableW * 0.25
  
  // Cabeçalho da tabela (fundo azul)
  doc.setFillColor(...PRIMARY)
  doc.rect(tableX, y, tableW, 8.5, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'bold')
  doc.text('SERVIÇO', tableX + 3, y + 6)
  doc.text('DESCRIÇÃO', tableX + colService + 3, y + 6)
  doc.text('VALOR', tableX + colService + colDesc + colValue / 2, y + 6, { align: 'center' })
  y += 8.5

  // Linha da tabela
  const descText = record.noteText || 'Sem descrição'
  const descLines = doc.splitTextToSize(descText, colDesc - 8)
  const rowHeight = Math.max(12, descLines.length * 5 + 6)
  
  // Fundo da linha (cinza claro)
  doc.setFillColor(...ROW_ALT)
  doc.rect(tableX, y, tableW, rowHeight, 'F')
  
  // Bordas
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.3)
  doc.rect(tableX, y, tableW, rowHeight)
  // Linhas verticais internas
  doc.line(tableX + colService, y, tableX + colService, y + rowHeight)
  doc.line(tableX + colService + colDesc, y, tableX + colService + colDesc, y + rowHeight)
  
  // Conteúdo
  doc.setTextColor(...TEXT_DARK)
  doc.setFontSize(9.5)
  
  // Serviço (negrito)
  doc.setFont('helvetica', 'bold')
  doc.text('Serviço auto', tableX + 3, y + 6)
  
  // Descrição
  doc.setFont('helvetica', 'normal')
  doc.text(descLines, tableX + colService + 3, y + 6)
  
  // Valor (negrito)
  doc.setFont('helvetica', 'bold')
  const valor = record.price ? `R$ ${record.price}` : '---'
  doc.text(valor, tableX + colService + colDesc + colValue / 2, y + rowHeight / 2 + 1.5, { align: 'center' })
  
  y += rowHeight + 10

  // ============================================================
  // 4. TOTAL EM DESTAQUE
  // ============================================================
  
  // Fundo laranja para o total
  doc.setFillColor(...ACCENT)
  doc.rect(tableX, y, tableW, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  const totalText = `VALOR TOTAL: ${record.price ? `R$ ${record.price}` : '---'}`
  doc.text(totalText, tableX + tableW / 2, y + 8.5, { align: 'center' })
  
  y += 20

  // ============================================================
  // 5. FOTOS
  // ============================================================
  
  const photos = record.photos || []
  if (photos.length > 0) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    
    doc.setTextColor(...PRIMARY)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('FOTOS DO SERVIÇO', margin, y)
    doc.setDrawColor(...PRIMARY)
    doc.setLineWidth(0.5)
    doc.line(margin, y + 2, margin + 40, y + 2)
    y += 8
    
    // Miniaturas em grade
    let xPos = margin
    let rowY = y
    const boxSize = 44
    const gap = 4
    const maxPerRow = Math.floor((contentWidth + gap) / (boxSize + gap))
    
    for (let i = 0; i < Math.min(photos.length, 8); i++) {
      const photo = photos[i]
      if (photo && typeof photo === 'string' && photo.length > 100) {
        try {
          if (xPos + boxSize > pageWidth - margin) {
            xPos = margin
            rowY += boxSize + gap
          }
          
          // Caixa com borda
          doc.setDrawColor(...LINE)
          doc.setLineWidth(0.3)
          doc.rect(xPos, rowY, boxSize, boxSize)
          
          // Imagem
          doc.addImage(photo, 'JPEG', xPos + 0.5, rowY + 0.5, boxSize - 1, boxSize - 1)
          xPos += boxSize + gap
        } catch {
          // ignora imagem inválida
        }
      }
    }
    
    if (photos.length > 8) {
      rowY += boxSize + 4
      doc.setFontSize(8)
      doc.setTextColor(...TEXT_MUTED)
      doc.text(`+ ${photos.length - 8} fotos adicionais`, margin, rowY)
      y = rowY + 10
    } else {
      y = rowY + boxSize + 10
    }
  }

  // ============================================================
  // 5b. ASSINATURA DO CLIENTE
  // ============================================================

  if (record.signature) {
    if (y > 240) {
      doc.addPage()
      y = 20
    }
    doc.setTextColor(...PRIMARY)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('ASSINATURA DO CLIENTE', margin, y)
    y += 4
    try {
      const sigW = 55
      const sigH = 24
      doc.setDrawColor(...LINE)
      doc.setLineWidth(0.3)
      doc.rect(margin, y, sigW, sigH)
      doc.addImage(record.signature, 'PNG', margin + 0.5, y + 0.5, sigW - 1, sigH - 1)
      y += sigH + 8
    } catch {
      // ignora assinatura inválida
    }
  }

  // ============================================================
  // 6. RODAPÉ
  // ============================================================
  
  if (y > 270) {
    doc.addPage()
    y = 20
  }
  
  // Linha separadora
  y = Math.max(y, 270)
  doc.setDrawColor(...LINE)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6
  
  // Texto do rodapé
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_MUTED)
  doc.setFont('helvetica', 'normal')
  doc.text('Documento gerado pelo Autoserviços', pageWidth / 2, y, { align: 'center' })
  
  // Data de impressão
  const now = new Date()
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  doc.text(`Impresso em ${now.toLocaleDateString('pt-BR')} às ${timeStr}`, pageWidth / 2, y + 5, { align: 'center' })

  return doc.output('blob')
}

export function pdfFileName(record: ServiceRecord): string {
  const name = (record.clientName || 'registro').replace(/\s/g, '_')
  const date = new Date(record.createdAt).toISOString().slice(0, 10)
  return `ordem_servico_${name}_${date}.pdf`
}

// Relatório resumido com todos os registros (útil para fechamento de mês)
export function generateBulkReportBlob(records: ServiceRecord[]): Blob {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const margin = 14
  const contentWidth = pageWidth - margin * 2
  let y = 20

  doc.setFillColor(...PRIMARY)
  doc.rect(0, 0, pageWidth, 5, 'F')

  doc.setTextColor(...PRIMARY)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('RELATÓRIO DE SERVIÇOS', margin, y)
  y += 6
  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(9.5)
  doc.setFont('helvetica', 'normal')
  const now = new Date()
  doc.text(`Gerado em ${now.toLocaleDateString('pt-BR')} • ${records.length} registro(s)`, margin, y)
  y += 8

  const total = records.reduce((sum, r) => {
    const cleaned = (r.price || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')
    const n = parseFloat(cleaned)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)

  doc.setFillColor(...ACCENT)
  doc.rect(margin, y, contentWidth, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `TOTAL: ${total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
    margin + contentWidth / 2,
    y + 7,
    { align: 'center' },
  )
  y += 16

  // Cabeçalho da tabela
  const colDate = contentWidth * 0.14
  const colClient = contentWidth * 0.3
  const colPlate = contentWidth * 0.18
  const colStatus = contentWidth * 0.22
  const colPrice = contentWidth * 0.16

  function drawHeader() {
    doc.setFillColor(...PRIMARY)
    doc.rect(margin, y, contentWidth, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8.5)
    doc.setFont('helvetica', 'bold')
    let x = margin + 2
    doc.text('DATA', x, y + 5.5)
    x += colDate
    doc.text('CLIENTE', x, y + 5.5)
    x += colClient
    doc.text('PLACA', x, y + 5.5)
    x += colPlate
    doc.text('STATUS', x, y + 5.5)
    x += colStatus
    doc.text('VALOR', x, y + 5.5)
    y += 8
  }

  drawHeader()

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  records.forEach((r, i) => {
    if (y > 280) {
      doc.addPage()
      y = 20
      drawHeader()
    }
    if (i % 2 === 0) {
      doc.setFillColor(...ROW_ALT)
      doc.rect(margin, y, contentWidth, 7, 'F')
    }
    doc.setTextColor(...TEXT_DARK)
    let x = margin + 2
    const dateStr = new Date(r.createdAt).toLocaleDateString('pt-BR')
    doc.text(dateStr, x, y + 5)
    x += colDate
    doc.text((r.clientName || '---').slice(0, 22), x, y + 5)
    x += colClient
    doc.text(r.plate || '---', x, y + 5)
    x += colPlate
    doc.text(STATUS_LABELS[r.status ?? 'em_andamento'], x, y + 5)
    x += colStatus
    doc.text(r.price ? `R$ ${r.price}` : '---', x, y + 5)
    y += 7
  })

  y += 6
  doc.setDrawColor(...LINE)
  doc.line(margin, y, pageWidth - margin, y)
  y += 5
  doc.setFontSize(8)
  doc.setTextColor(...TEXT_MUTED)
  doc.text('Documento gerado pelo Autoserviços', pageWidth / 2, y, { align: 'center' })

  return doc.output('blob')
}