create table if not exists workshop_profile (
 id uuid primary key default gen_random_uuid(),
 user_id uuid references auth.users(id) on delete cascade unique,
 name text,
 phone text,
 logo_url text,
 footer_text text,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);
alter table workshop_profile enable row level security;
create policy "user own profile" on workshop_profile for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
