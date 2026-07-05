create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  email text,
  created_at timestamptz not null default now()
);

alter table public.teachers enable row level security;

create policy "Teachers are readable by authenticated users"
  on public.teachers
  for select
  to authenticated
  using (true);
