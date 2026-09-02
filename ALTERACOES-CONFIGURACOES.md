# Configurações — implementação completa

Esta versão mantém as funções originais do AUTOeletroService e acrescenta/integra:

- Tela de Configurações reorganizada em linhas horizontais, com ícone, título, descrição e controle à direita.
- Tema claro/escuro e tamanho de fonte.
- Idioma com seletor preparado para expansão (Português do Brasil nesta versão).
- Notificações configuráveis para alertas de agendamento.
- Bloqueio por PIN de 4 dígitos: criar, bloquear agora, desbloquear, alterar e remover.
- Conquistas calculadas a partir dos registros reais.
- Pular tela inicial/apresentação.
- Categoria padrão em novos registros.
- Colagem inteligente para detectar telefone e placa ao colar.
- Formato de data DD/MM/AAAA ou MM/DD/AAAA.
- Primeiro dia da semana: domingo ou segunda-feira.
- Persistência das novas preferências em localStorage.
- Integração de formato de data com Agenda, visualização e compartilhamento.
- Integração do início da semana com o calendário.
- Backup JSON, relatório PDF, importação, otimização de fotos e limpeza mantidos.

## Arquivos principais adicionados

- `lib/settings.ts`
- `components/pin-pad.tsx`
- `components/achievements-screen.tsx`
- `components/language-modal.tsx`

## Arquivos principais atualizados

- `components/autoservicos-app.tsx`
- `components/settings-sidebar.tsx`
- `components/record-editor-modal.tsx`
- `components/calendar-panel.tsx`
- `components/agenda-page.tsx`
- `components/view-record-modal.tsx`
- `components/share-modal.tsx`
- `lib/types.ts`
- `app/globals.css`
