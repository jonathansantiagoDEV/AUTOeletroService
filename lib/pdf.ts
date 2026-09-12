import { jsPDF } from 'jspdf'
import type { ServiceRecord } from './types'
import { CATEGORY_LABELS, STATUS_LABELS } from './types'
import { VALDECI_LOGO_BASE64 } from './logo-base64'
import type { WorkshopProfile } from './workshop-profile'


const PRIMARY: [number, number, number] = [0, 82, 155]
const PRIMARY_LIGHT: [number, number, number] = [0, 112, 201]
const ACCENT: [number, number, number] = [237, 116, 40]
const TEXT_DARK: [number, number, number] = [26, 26, 26]
const TEXT_MUTED: [number, number, number] = [110, 110, 110]
const LINE: [number, number, number] = [220, 220, 220]
const ROW_ALT: [number, number, number] = [248, 248, 248]


async function urlToBase64(url:string):Promise<string>{

  const response = await fetch(url)

  const blob = await response.blob()

  return new Promise(resolve=>{

    const reader = new FileReader()

    reader.onloadend = ()=>{

      resolve(reader.result as string)

    }

    reader.readAsDataURL(blob)

  })

}


async function makeRoundedImage(src: string, radius = 60): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')

      const size = Math.max(img.width, img.height)

      canvas.width = size
      canvas.height = size

      const ctx = canvas.getContext('2d')

      if (!ctx) {
        reject(new Error('Canvas indisponível'))
        return
      }

      ctx.clearRect(0, 0, size, size)

      ctx.beginPath()
      ctx.arc(
        size / 2,
        size / 2,
        size / 2,
        0,
        Math.PI * 2
      )

      ctx.closePath()
      ctx.clip()

      const offsetX = (size - img.width) / 2
      const offsetY = (size - img.height) / 2

      ctx.drawImage(
        img,
        offsetX,
        offsetY
      )

      resolve(canvas.toDataURL('image/png'))
    }

    img.onerror = () => reject(new Error('Erro ao carregar imagem'))

    img.src = src
  })
}


// Relatório resumido mantido para compatibilidade com o aplicativo
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

  y += 8

  doc.setFontSize(9)
  doc.setTextColor(...TEXT_MUTED)
  doc.text(
    `Gerado em ${new Date().toLocaleDateString('pt-BR')} - ${records.length} registro(s)`,
    margin,
    y
  )

  y += 12

  doc.setFillColor(...PRIMARY)
  doc.rect(margin, y, contentWidth, 8, 'F')

  doc.setTextColor(255,255,255)
  doc.setFontSize(8)

  doc.text('CLIENTE', margin + 3, y + 5)
  doc.text('VALOR', 160, y + 5)

  y += 12

  doc.setTextColor(...TEXT_DARK)

  records.forEach((record, index) => {

    if (y > 275) {
      doc.addPage()
      y = 20
    }

    if(index % 2 === 0){
      doc.setFillColor(...ROW_ALT)
      doc.rect(margin, y - 4, contentWidth, 7, 'F')
    }

    doc.text(
      record.clientName || '---',
      margin + 3,
      y
    )

    doc.text(
      record.price ? `R$ ${record.price}` : '---',
      160,
      y
    )

    y += 7
  })


  doc.setTextColor(...TEXT_MUTED)
  doc.setFontSize(8)

  doc.text(
    'Relatório gerado pelo sistema',
    pageWidth / 2,
    285,
    {align:'center'}
  )

  return doc.output('blob')
}




export async function generatePDFBlob(
record: ServiceRecord,
profile?: WorkshopProfile | null
): Promise<Blob>{


const doc = new jsPDF('p','mm','a4')


const pageWidth = 210
const margin = 18
const contentWidth = pageWidth - margin * 2


let y = 18



// ==============================
// LOGO PERSONALIZADA
// ==============================


let logo = VALDECI_LOGO_BASE64


if(profile?.logo_url){

try{

const base64Logo = await urlToBase64(profile.logo_url)

logo = await makeRoundedImage(base64Logo)

}catch{

console.log("Não foi possível carregar logo")

}

}



// ==============================
// CABEÇALHO
// ==============================


doc.setFillColor(...PRIMARY)

doc.rect(0,0,pageWidth,5,'F')


doc.setFillColor(...ACCENT)

const triangleLeftX = pageWidth - 100
const triangleRightX = pageWidth
const triangleBottomY = 44

doc.triangle(
triangleLeftX,
0,
triangleRightX,
0,
triangleRightX,
triangleBottomY,
'F'
)



const headerLogoW = 24
const headerLogoH = 24
const headerLogoY = 5

// A pastilha do telefone fica rente à borda direita da tabela (mesma
// linha azul de SERVIÇO/DESCRIÇÃO/VALOR). A logo, por ser mais estreita
// que a pastilha, fica centralizada em relação a ela, e não à borda.
const headerRightX = pageWidth - margin

const phonePillW = headerLogoW+8

const phonePillX =
headerRightX - phonePillW

const headerLogoX = phonePillX + phonePillW/2 - headerLogoW/2




doc.addImage(
logo,
'PNG',
headerLogoX,
headerLogoY,
headerLogoW,
headerLogoH
)



const phone = profile?.phone || "Telefone não informado"



const phonePillY =
headerLogoY + headerLogoH + 2.5



doc.setFillColor(...PRIMARY)

doc.roundedRect(
phonePillX,
phonePillY,
phonePillW,
6.5,
2,
2,
'F'
)


doc.setTextColor(255,255,255)

doc.setFontSize(7)

doc.setFont('helvetica','bold')


doc.text(
phone,
phonePillX+phonePillW/2,
phonePillY+4,
{
align:'center'
}
)


doc.setFont('helvetica','normal')



doc.setTextColor(...PRIMARY)

doc.setFontSize(22)

doc.setFont('helvetica','bold')

doc.text(
'ORDEM DE SERVIÇO',
margin,
28
)

doc.setFont('helvetica','normal')



doc.setTextColor(...TEXT_MUTED)

doc.setFontSize(10)


const dateObj = new Date(record.createdAt)

const dateStr =
dateObj.toLocaleDateString('pt-BR')


const idShort =
(record.id || '').slice(-6).toUpperCase()


doc.text(
`Nº ${idShort} | Emitido em ${dateStr}`,
margin,
36
)



y = 50



// ==============================
// OFICINA
// ==============================


doc.setTextColor(...PRIMARY)

doc.setFontSize(10)

doc.setFont('helvetica','bold')

doc.text(
'OFICINA:',
margin,
y
)


y+=8


doc.setTextColor(...TEXT_DARK)

doc.setFontSize(9.5)

doc.setFont('helvetica','normal')


const oficinaNome =
profile?.company_name ||
'Empresa não configurada'


doc.text(
oficinaNome,
margin,
y
)


y+=6


doc.text(
'Documento de serviço',
margin,
y
)


y+=6


doc.text(
`Gerado em ${dateStr}`,
margin,
y
)



// ==============================
// CLIENTE
// ==============================


const clienteX = 110


doc.setTextColor(...PRIMARY)

doc.setFont('helvetica','bold')

doc.text(
'CLIENTE:',
clienteX,
50
)


doc.setTextColor(...TEXT_DARK)

doc.setFont('helvetica','normal')

doc.text(
record.clientName || '---',
clienteX,
58
)


if(record.plate){

doc.text(
`Placa: ${record.plate}`,
clienteX,
64
)

}



y=80



// ==============================
// SERVIÇO
// ==============================


const tableTop = y

const col1X = margin
const col2X = 80
const col3X = 170
const tableRight = margin + contentWidth


doc.setFillColor(...PRIMARY)

doc.rect(
margin,
y,
contentWidth,
9,
'F'
)



doc.setTextColor(255,255,255)

doc.setFontSize(9)

doc.setFont('helvetica','bold')


doc.text(
'SERVIÇO',
(col1X + col2X) / 2,
y+6,
{ align: 'center' }
)


doc.text(
'DESCRIÇÃO',
(col2X + col3X) / 2,
y+6,
{ align: 'center' }
)


doc.text(
'VALOR',
(col3X + tableRight) / 2,
y+6,
{ align: 'center' }
)



y+=10

const rowTop = y



doc.setTextColor(...TEXT_DARK)

doc.setFont('helvetica','normal')
doc.setFontSize(9)

const rowTopPadding = 8
const rowBottomPadding = 8
const descLineHeight = 5.2


doc.text(
(record.category && CATEGORY_LABELS[record.category]) || 'Serviço geral',
margin+3,
y+rowTopPadding
)


// Espaço interno dos dois lados da coluna de descrição para o texto
// não encostar nas linhas divisórias da tabela
const descX = col2X + 4
const descRight = col3X - 4
const descMaxWidth = (col3X - col2X) - 8

const descAlign = record.textStyle?.align || 'left'

let descTextX = descX
if (descAlign === 'center') {
  descTextX = (col2X + col3X) / 2
} else if (descAlign === 'right') {
  descTextX = descRight
}

const descLines = doc.splitTextToSize(record.noteText || 'Sem descrição', descMaxWidth)
doc.text(
descLines,
descTextX,
y+rowTopPadding,
{
align: descAlign,
...(descAlign === 'justify' ? { maxWidth: descMaxWidth } : {}),
}
)


doc.text(
record.price ? `R$ ${record.price}` : '---',
(col3X + tableRight) / 2,
y+rowTopPadding,
{ align: 'center' }
)



y += Math.max(25, rowTopPadding + descLines.length * descLineHeight + rowBottomPadding)

const tableBottom = y

// Contorno da tabela (borda externa, divisória cabeçalho/linha e colunas)
doc.setDrawColor(190, 190, 190)
doc.setLineWidth(0.3)
doc.rect(margin, tableTop, contentWidth, tableBottom - tableTop)
doc.line(margin, rowTop, tableRight, rowTop)
doc.line(col2X, tableTop, col2X, tableBottom)
doc.line(col3X, tableTop, col3X, tableBottom)



doc.setFillColor(...ACCENT)

doc.rect(
margin,
y,
contentWidth,
12,
'F'
)


doc.setTextColor(255,255,255)

doc.setFontSize(13)

doc.setFont('helvetica','bold')


doc.text(
`VALOR TOTAL: ${record.price ? `R$ ${record.price}`:'---'}`,
105,
y+8,
{
align:'center'
}
)



// ==============================
// RODAPÉ
// ==============================


doc.setTextColor(...TEXT_MUTED)

doc.setFontSize(8)

doc.setFont('helvetica','normal')



const footer =
profile?.footer_text ||
`Documento gerado por ${profile?.company_name || 'Empresa não configurada'}`



doc.text(
footer,
105,
285,
{
align:'center'
}
)



doc.text(
`Impresso em ${new Date().toLocaleDateString('pt-BR')}`,
105,
290,
{
align:'center'
}
)



return doc.output('blob')


}



export function pdfFileName(record:ServiceRecord){

const name =
(record.clientName || 'registro')
.replace(/\s/g,'_')


const date =
new Date(record.createdAt)
.toISOString()
.slice(0,10)


return `ordem_servico_${name}_${date}.pdf`

}