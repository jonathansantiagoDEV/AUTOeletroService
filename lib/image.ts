/**
 * Lê um arquivo de imagem e devolve uma dataURL já com a orientação correta.
 *
 * Fotos tiradas por celular guardam os pixels "deitados" e usam um metadado
 * EXIF para indicar a rotação correta. O navegador respeita esse metadado ao
 * exibir a imagem em uma tag <img>, mas bibliotecas como o jsPDF ignoram o
 * EXIF e desenham os pixels crus — por isso uma foto tirada em modo retrato
 * podia aparecer deitada no PDF gerado.
 *
 * Ao desenhar a imagem em um <canvas>, o navegador aplica a orientação EXIF
 * automaticamente, então o resultado exportado do canvas já sai com a
 * rotação correta "gravada" nos pixels — resolvendo o problema tanto na
 * exibição quanto na geração do PDF.
 */
export function normalizeImageOrientation(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result !== 'string') {
        reject(new Error('Falha ao ler o arquivo de imagem'))
        return
      }
      const img = new Image()
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = img.naturalWidth
          canvas.height = img.naturalHeight
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            // Sem suporte a canvas: usa a imagem original como fallback
            resolve(result)
            return
          }
          ctx.drawImage(img, 0, 0)
          resolve(canvas.toDataURL('image/jpeg', 0.92))
        } catch {
          // Qualquer erro ao processar: usa a imagem original como fallback
          resolve(result)
        }
      }
      img.onerror = () => resolve(result)
      img.src = result
    }
    reader.onerror = () => reject(reader.error ?? new Error('Falha ao ler o arquivo'))
    reader.readAsDataURL(file)
  })
}
