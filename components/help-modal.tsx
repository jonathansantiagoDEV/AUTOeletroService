'use client'

import {
  BarChart3,
  Bell,
  Camera,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock,
  Hash,
  MessageCircle,
  PackageSearch,
  Pencil,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  Trash2,
  X,
  type LucideIcon,
} from 'lucide-react'

interface HelpModalProps {
  open: boolean
  onClose: () => void
}

interface HelpItem {
  icon: LucideIcon
  iconColor?: string
  title: string
  text: string
}

interface HelpSection {
  heading: string
  items: HelpItem[]
}

const SECTIONS: HelpSection[] = [
  {
    heading: 'No topo da tela',
    items: [
      {
        icon: CalendarClock,
        title: 'Agendamentos',
        text: 'Mostra os serviços agendados para clientes. O número vermelho indica quantos estão aguardando confirmação ou próximos da data.',
      },
      {
        icon: BarChart3,
        title: 'Vendas e faturamento',
        text: 'Abre o resumo do quanto você faturou no mês, com gráfico por categoria de serviço.',
      },
      {
        icon: CalendarDays,
        title: 'Calendário',
        text: 'Veja todos os agendamentos organizados por data, em formato de calendário.',
      },
      {
        icon: Settings,
        title: 'Configurações',
        text: 'Ajuste aparência (claro/escuro), tamanho da fonte, exporte ou importe seus dados, e gerencie sua conta.',
      },
    ],
  },
  {
    heading: 'Busca e filtros',
    items: [
      {
        icon: Search,
        title: 'Buscar',
        text: 'Digite o nome do cliente, a placa do veículo ou um trecho da nota para encontrar um registro rapidamente.',
      },
      {
        icon: Clock,
        iconColor: '#f59e0b',
        title: 'Em andamento',
        text: 'Filtra apenas os serviços que ainda estão sendo feitos.',
      },
      {
        icon: CheckCircle2,
        iconColor: '#22c55e',
        title: 'Concluído',
        text: 'Filtra os serviços já finalizados e entregues ao cliente.',
      },
      {
        icon: PackageSearch,
        iconColor: '#ef4444',
        title: 'Aguardando peça',
        text: 'Filtra serviços parados esperando alguma peça chegar.',
      },
    ],
  },
  {
    heading: 'Em cada registro',
    items: [
      {
        icon: Phone,
        iconColor: '#0284c7',
        title: 'Ligar',
        text: 'Toca no ícone de telefone para ligar direto para o cliente.',
      },
      {
        icon: MessageCircle,
        iconColor: '#25D366',
        title: 'WhatsApp',
        text: 'Abre uma conversa no WhatsApp com o número salvo do cliente.',
      },
      {
        icon: Pencil,
        iconColor: '#d97706',
        title: 'Editar',
        text: 'Altera qualquer informação do registro: nome, placa, valor, nota, fotos e status.',
      },
      {
        icon: Trash2,
        iconColor: '#d32f2f',
        title: 'Excluir',
        text: 'Remove o registro. Essa ação não pode ser desfeita, então confirme antes de apagar.',
      },
      {
        icon: Share2,
        title: 'Compartilhar',
        text: 'Gera um resumo do serviço (em PDF ou texto) pronto para enviar ao cliente.',
      },
      {
        icon: Hash,
        title: 'Placa e valor',
        text: 'Ficam sempre em destaque no card para identificar o veículo e o valor cobrado rapidamente.',
      },
    ],
  },
  {
    heading: 'Fotos do serviço',
    items: [
      {
        icon: Camera,
        title: 'Adicionar fotos',
        text: 'Ao editar um registro, você pode anexar várias fotos do serviço realizado.',
      },
      {
        icon: Search,
        title: 'Ver em tela cheia',
        text: 'Toque em qualquer foto para abrir em tela cheia. Nessa visualização dá para arrastar o dedo para o lado e ver as outras fotos, ou usar dois dedos (pinça) para dar zoom e ver detalhes.',
      },
    ],
  },
  {
    heading: 'Botões flutuantes',
    items: [
      {
        icon: Camera,
        title: 'Registrar com a câmera',
        text: 'Tira uma foto na hora e já inicia um novo registro de serviço com ela anexada.',
      },
      {
        icon: Plus,
        title: 'Novo registro',
        text: 'Cria um novo registro de serviço em branco para você preencher manualmente.',
      },
      {
        icon: Bell,
        title: 'Alerta de agendamento',
        text: 'Quando chega a hora de um agendamento, o card do cliente pisca em vermelho para te avisar.',
      },
    ],
  },
]

export function HelpModal({ open, onClose }: HelpModalProps) {
  if (!open) return null

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[6500] flex h-[100dvh] items-end justify-center bg-black/60 sm:items-center sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-card shadow-2xl sm:max-h-[85vh] sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-border bg-primary px-5 py-4 text-primary-foreground">
          <div>
            <h2 className="text-lg font-extrabold">Como funciona o app</h2>
            <p className="text-xs text-white/70">O que cada botão e função faz</p>
          </div>
          <button
            aria-label="Fechar"
            onClick={onClose}
            className="rounded-full p-2 hover:bg-white/20"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="thin-scroll flex-1 space-y-5 overflow-y-auto p-5">
          {SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {section.heading}
              </h3>
              <div className="space-y-3">
                {section.items.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex items-start gap-3">
                      <div
                        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: item.iconColor ? `${item.iconColor}26` : 'var(--color-primary)26',
                          color: item.iconColor ?? 'var(--color-primary)',
                        }}
                      >
                        <Icon className="size-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.text}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-primary py-3 font-bold text-primary-foreground transition hover:bg-primary-dark"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
