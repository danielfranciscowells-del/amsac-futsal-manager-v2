-- AMSAC FUTSAL MANAGER - base nova
create extension if not exists pgcrypto;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  number integer,
  position text,
  photo_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.competitions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text default 'Campeonato',
  created_at timestamptz default now()
);

create table if not exists public.competition_teams (
  id uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade,
  name text not null,
  logo_url text
);

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  date date,
  competition_id uuid references public.competitions(id),
  opponent text not null,
  home_away text default 'Casa',
  minutes integer default 20,
  halves integer default 2,
  gf integer default 0,
  ga integer default 0,
  status text default 'agendado',
  created_at timestamptz default now()
);

create table if not exists public.game_players (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  role text not null check (role in ('starter','sub'))
);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  player_id uuid references public.players(id),
  event_type text not null,
  minute integer default 0,
  assist_player_id uuid references public.players(id),
  reason text,
  zone text,
  created_at timestamptz default now()
);

create table if not exists public.attendances (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  session_date date not null,
  status text not null default 'presente',
  notes text
);

create table if not exists public.evaluations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  evaluation_date date default current_date,
  psychological integer default 0,
  physical integer default 0,
  tactical integer default 0,
  technical integer default 0,
  notes text
);

create table if not exists public.fines (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references public.players(id) on delete cascade,
  amount numeric(10,2) default 0,
  reason text,
  fine_date date default current_date,
  paid boolean default false
);

create table if not exists public.convocations (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete cascade,
  player_id uuid references public.players(id) on delete cascade,
  status text default 'convocado'
);

-- Para uma app privada sem login, estas policies permitem leitura/escrita através da anon key.
-- Usa isto apenas se aceitares que quem tiver acesso à app possa alterar os dados.
alter table public.players enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_teams enable row level security;
alter table public.games enable row level security;
alter table public.game_players enable row level security;
alter table public.game_events enable row level security;
alter table public.attendances enable row level security;
alter table public.evaluations enable row level security;
alter table public.fines enable row level security;
alter table public.convocations enable row level security;

drop policy if exists "anon_all_players" on public.players;
drop policy if exists "anon_all_competitions" on public.competitions;
drop policy if exists "anon_all_competition_teams" on public.competition_teams;
drop policy if exists "anon_all_games" on public.games;
drop policy if exists "anon_all_game_players" on public.game_players;
drop policy if exists "anon_all_game_events" on public.game_events;
drop policy if exists "anon_all_attendances" on public.attendances;
drop policy if exists "anon_all_evaluations" on public.evaluations;
drop policy if exists "anon_all_fines" on public.fines;
drop policy if exists "anon_all_convocations" on public.convocations;

create policy "anon_all_players" on public.players for all to anon using (true) with check (true);
create policy "anon_all_competitions" on public.competitions for all to anon using (true) with check (true);
create policy "anon_all_competition_teams" on public.competition_teams for all to anon using (true) with check (true);
create policy "anon_all_games" on public.games for all to anon using (true) with check (true);
create policy "anon_all_game_players" on public.game_players for all to anon using (true) with check (true);
create policy "anon_all_game_events" on public.game_events for all to anon using (true) with check (true);
create policy "anon_all_attendances" on public.attendances for all to anon using (true) with check (true);
create policy "anon_all_evaluations" on public.evaluations for all to anon using (true) with check (true);
create policy "anon_all_fines" on public.fines for all to anon using (true) with check (true);
create policy "anon_all_convocations" on public.convocations for all to anon using (true) with check (true);

-- Espaço partilhado da equipa (treinador + adjuntos)
create table if not exists public.team_spaces (
  code text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.team_spaces enable row level security;
drop policy if exists "anon_all_team_spaces" on public.team_spaces;
create policy "anon_all_team_spaces" on public.team_spaces for all to anon using (true) with check (true);
