-- Execute este script no SQL Editor do Supabase.
-- Ele SÓ adiciona colunas novas, não apaga nem altera nada que já existe.

alter table public.service_records
  add column if not exists category text,
  add column if not exists signature text;
