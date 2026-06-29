-- =====================================================
-- Burn Industry Dashboard — Migration 001
-- All personal data for Denz: tasks, journal, money,
-- routines, preferences, tour advance, P&L
-- =====================================================

-- One user owns everything. No multi-tenant needed.
-- RLS policies lock all tables to auth.uid().

-- PREFERENCES
create table preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  sound boolean not null default true,
  music boolean not null default false,
  band_emails text not null default 'denz@burnindustry.com, simonouthit@gmail.com',
  updated_at timestamptz not null default now()
);

-- STREAK
create table streak (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  count integer not null default 0,
  last_day date
);

-- MASTER TASK LIST
create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  energy integer not null default 2 check (energy between 1 and 3),
  priority integer not null default 2 check (priority between 1 and 3),
  done boolean not null default false,
  created_at timestamptz not null default now()
);

-- DAILY STATE (per-day: routines, battles, energy)
create table daily_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  morning_done jsonb not null default '{}',
  night_done jsonb not null default '{}',
  battle_slots jsonb not null default '[null,null,null]',
  battle_done jsonb not null default '{}',
  unplanned jsonb not null default '[]',
  ko_shown boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- JOURNAL
create table journal (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  honest text,
  good text,
  night text,
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- MONEY: DEBT BALANCES
create table debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  debt_id text not null,
  name text not null,
  bal numeric(12,2) not null default 0,
  rate numeric(5,2) not null,
  min_payment integer not null,
  due_day integer not null,
  autopay boolean not null default false,
  sort_order integer not null default 0,
  unique (user_id, debt_id)
);

-- MONEY: INCOME LOG
create table income_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,
  type text not null,
  amt numeric(12,2) not null,
  note text,
  date date not null,
  allocation jsonb,
  created_at timestamptz not null default now()
);

-- MONEY: SPENDING LOG
create table spending_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period text not null,
  amt numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

-- ADVANCE DATA (show-specific logistics)
create table advance_data (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  show_date text not null,
  data jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  unique (user_id, show_date)
);

-- TOUR P&L
create table pnl (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  show_date text not null,
  income jsonb not null default '[]',
  expenses jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  unique (user_id, show_date)
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
do $$
declare t text;
begin
  foreach t in array array['preferences','streak','tasks','daily_state','journal','debts','income_log','spending_log','advance_data','pnl'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "own" on %I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- =====================================================
-- KEEP-ALIVE: lightweight table pinged by cron
-- =====================================================
create table keepalive (
  id serial primary key,
  pinged_at timestamptz not null default now()
);
-- No RLS needed — pinged by service role from API route
insert into keepalive default values;
