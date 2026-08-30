-- Execute este script no SQL Editor do seu projeto Supabase
-- (Painel do Supabase > SQL Editor > New query > cole e clique em "Run")

create table if not exists public.service_records (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null default '',
  note_text text not null default '',
  plate text not null default '',
  price text not null default '',
  photos jsonb not null default '[]'::jsonb,
  text_style jsonb not null default '{}'::jsonb,
  schedule text,
  schedule_time text,
  created_at timestamptz not null default now()
);

-- Índice para consultas rápidas por usuário
create index if not exists service_records_user_id_idx on public.service_records(user_id);

-- Ativa Row Level Security: cada usuário só enxerga e altera os próprios registros
alter table public.service_records enable row level security;

drop policy if exists "Usuários veem seus próprios registros" on public.service_records;
create policy "Usuários veem seus próprios registros"
  on public.service_records for select
  using (auth.uid() = user_id);

drop policy if exists "Usuários criam seus próprios registros" on public.service_records;
create policy "Usuários criam seus próprios registros"
  on public.service_records for insert
  with check (auth.uid() = user_id);

drop policy if exists "Usuários atualizam seus próprios registros" on public.service_records;
create policy "Usuários atualizam seus próprios registros"
  on public.service_records for update
  using (auth.uid() = user_id);

drop policy if exists "Usuários apagam seus próprios registros" on public.service_records;
create policy "Usuários apagam seus próprios registros"
  on public.service_records for delete
  using (auth.uid() = user_id);
