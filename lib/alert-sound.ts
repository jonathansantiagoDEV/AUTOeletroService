// Toca um alerta sonoro (3 bipes) usando a Web Audio API, sem precisar de
// nenhum arquivo de áudio externo. Usado quando um agendamento chega na hora.
let sharedCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtor) return null
  if (!sharedCtx) sharedCtx = new AudioCtor()
  return sharedCtx
}

export function playAlertSound() {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()

  const beepTimes = [0, 0.35, 0.7]
  beepTimes.forEach((offset) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    const start = ctx.currentTime + offset
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(0.35, start + 0.02)
    gain.gain.linearRampToValueAtTime(0, start + 0.25)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(start)
    osc.stop(start + 0.28)
  })
}

// Precisa ser chamada a partir de uma interação do usuário (clique/toque) ao menos uma vez,
// para que navegadores que bloqueiam áudio automático liberem o contexto de áudio.
export function unlockAudio() {
  const ctx = getContext()
  if (ctx && ctx.state === 'suspended') ctx.resume()
}
