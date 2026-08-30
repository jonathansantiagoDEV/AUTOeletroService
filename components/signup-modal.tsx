'use client'

import { useState } from 'react'
import { Eye, EyeOff, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface SignupModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (message: string) => void
}

export function SignupModal({ open, onClose, onSuccess }: SignupModalProps) {
  const [email, setEmail] = useState('')
  const [confirmEmail, setConfirmEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function resetAndClose() {
    setEmail('')
    setConfirmEmail('')
    setPassword('')
    setShowPassword(false)
    setError(null)
    setLoading(false)
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()) {
      setError('Os e-mails não coincidem.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(traduzErro(error.message))
      setLoading(false)
      return
    }

    setEmail('')
    setConfirmEmail('')
    setPassword('')
    setShowPassword(false)
    setError(null)
    setLoading(false)
    onSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro antes de entrar.')
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div className="animate-fade-up w-full max-w-sm rounded-t-3xl border border-border bg-card p-6 shadow-xl sm:rounded-3xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-foreground">Criar conta</h2>
            <p className="text-sm text-muted-foreground">Preencha os dados abaixo</p>
          </div>
          <button
            type="button"
            onClick={resetAndClose}
            aria-label="Fechar"
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="px-1 text-xs font-semibold text-muted-foreground">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seuemail@exemplo.com"
              className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="px-1 text-xs font-semibold text-muted-foreground">Confirmar e-mail</label>
            <input
              type="email"
              required
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Repita o e-mail"
              className="w-full rounded-full border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="px-1 text-xs font-semibold text-muted-foreground">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 6 caracteres"
                className="w-full rounded-full border border-border bg-background px-4 py-2.5 pr-11 text-sm text-foreground outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-center text-xs font-medium text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-dark disabled:opacity-60"
          >
            {loading ? 'Aguarde...' : 'Cadastrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

function traduzErro(msg: string) {
  if (msg.includes('User already registered')) return 'Este e-mail já está cadastrado.'
  if (msg.includes('Password should be')) return 'A senha deve ter pelo menos 6 caracteres.'
  if (msg.includes('Unable to validate email')) return 'E-mail inválido.'
  return msg
}
