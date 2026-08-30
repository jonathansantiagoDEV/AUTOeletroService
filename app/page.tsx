import { AutoservicosApp } from '@/components/autoservicos-app'
import { ToastProvider } from '@/components/toast'

export default function Page() {
  return (
    <ToastProvider>
      <AutoservicosApp />
    </ToastProvider>
  )
}
