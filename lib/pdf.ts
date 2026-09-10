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

logo = await urlToBase64(profile.logo_url)

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

doc.triangle(
pageWidth-70,
0,
pageWidth,
0,
pageWidth,
44,
'F'
)



const headerLogoW = 24
const headerLogoH = 24

const headerLogoX = pageWidth-margin-headerLogoW
const headerLogoY = 5



doc.addImage(
logo,
'PNG',
headerLogoX,
headerLogoY,
headerLogoW,
headerLogoH
)



const phone = profile?.phone || "Telefone não informado"



const phonePillW = headerLogoW+8

const phonePillX =
headerLogoX + headerLogoW/2 - phonePillW/2


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



doc.setTextColor(...PRIMARY)

doc.setFontSize(22)

doc.text(
'ORDEM DE SERVIÇO',
margin,
28
)



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

doc.text(
'OFICINA:',
margin,
y
)


y+=8


doc.setTextColor(...TEXT_DARK)

doc.setFontSize(9.5)


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

doc.text(
'CLIENTE:',
clienteX,
50
)


doc.setTextColor(...TEXT_DARK)

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


doc.text(
'SERVIÇO',
margin+3,
y+6
)


doc.text(
'DESCRIÇÃO',
80,
y+6
)


doc.text(
'VALOR',
170,
y+6
)



y+=10



doc.setTextColor(...TEXT_DARK)


doc.text(
'Serviço auto',
margin+3,
y+8
)


doc.text(
record.noteText || 'Sem descrição',
80,
y+8
)


doc.text(
record.price ? `R$ ${record.price}` : '---',
170,
y+8
)



y+=25



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