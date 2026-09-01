-- Execute este script no SQL Editor do Supabase.
-- Ele SÓ adiciona colunas novas, não apaga nem altera nada que já existe.

alter table public.service_records
  add column if not exists client_phone text,
  add column if not exists status text not null default 'em_andamento';
