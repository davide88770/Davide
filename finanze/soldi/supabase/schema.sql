-- Soldi di Davide — schema del database su Supabase.
--
-- Da incollare in Supabase → SQL Editor → New query → Run.
-- Si può rieseguire senza danni: crea solo quello che manca.

create table if not exists public.settings (
  user_id    uuid primary key references auth.users on delete cascade,
  data       jsonb not null,
  updated_at timestamptz default now()
);

create table if not exists public.transactions (
  id         text not null,
  user_id    uuid not null references auth.users on delete cascade,
  data       jsonb not null,
  updated_at timestamptz default now(),
  primary key (user_id, id)
);

-- Row Level Security: obbligatoria. Ogni utente legge e scrive solo le sue righe.
alter table public.settings     enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "own settings" on public.settings;
drop policy if exists "own tx"       on public.transactions;
create policy "own settings" on public.settings
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own tx" on public.transactions
  for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Permessi espliciti per gli utenti autenticati (nei progetti nuovi non sono
-- sempre concessi in automatico). Gli anonimi non hanno niente.
grant select, insert, update, delete on public.settings, public.transactions to authenticated;
revoke all on public.settings, public.transactions from anon;

-- Tempo reale: le modifiche fatte su un dispositivo arrivano sugli altri.
do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'transactions') then
    alter publication supabase_realtime add table public.transactions;
  end if;
  if not exists (select 1 from pg_publication_tables
                 where pubname = 'supabase_realtime' and tablename = 'settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
end $$;
