import { createClient } from '@/lib/supabase/client'

export type WorkshopProfile = {
  company_name: string
  phone: string
  logo_url?: string | null
  footer_text?: string | null
}

export async function getWorkshopProfile(): Promise<WorkshopProfile | null> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('workshop_profile')
    .select('company_name,phone,logo_url,footer_text')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar perfil da oficina:', error)
    return null
  }

  return data
}
