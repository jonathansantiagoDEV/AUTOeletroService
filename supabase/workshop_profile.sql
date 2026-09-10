create table if not exists public.workshop_profile (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade unique not null,
 name text not null default 'Minha Oficina',
 phone text,
 logo_url text,
 footer_text text,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

alter table public.workshop_profile enable row level security;
create policy "user own workshop profile" on public.workshop_profile for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets(id,name,public) values('workshop-logos','workshop-logos',true) on conflict do nothing;
