import { createClient } from './client'

const BUCKET = 'service-photos'

// Converte uma dataURL (ex.: "data:image/jpeg;base64,...") em um Blob para upload.
function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mimeMatch = header.match(/data:(.*?);base64/)
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mime })
}

// Envia uma foto (já em dataURL, normalizada) para o Storage e devolve a URL pública.
// Retorna null se o upload falhar — quem chamar deve avisar o usuário e manter a foto anterior.
export async function uploadPhoto(dataUrl: string, userId: string): Promise<string | null> {
  try {
    const supabase = createClient()
    const blob = dataUrlToBlob(dataUrl)
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`

    const { error } = await supabase.storage.from(BUCKET).upload(fileName, blob, {
      contentType: blob.type || 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    })

    if (error) {
      console.error('Erro ao enviar foto para o Storage:', error.message)
      return null
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName)
    return data.publicUrl
  } catch (e) {
    console.error('Erro ao processar upload da foto:', e)
    return null
  }
}

// Remove uma foto do Storage a partir da URL pública salva no registro.
// Ignora silenciosamente se a "foto" ainda for um base64 antigo (registro criado antes desta migração)
// — nesse caso não há nada no Storage para apagar.
export async function deletePhoto(url: string): Promise<void> {
  if (!url.includes(`/${BUCKET}/`)) return
  try {
    const supabase = createClient()
    const path = url.split(`/${BUCKET}/`)[1]
    if (!path) return
    await supabase.storage.from(BUCKET).remove([path])
  } catch (e) {
    console.error('Erro ao remover foto do Storage:', e)
  }
}
