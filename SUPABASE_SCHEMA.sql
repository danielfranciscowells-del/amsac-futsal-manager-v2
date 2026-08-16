
create extension if not exists pgcrypto;

create table if not exists players (
 id uuid primary key default gen_random_uuid(),
 name text not null, number int, position text, photo_url text, active boolean default true,
 created_at timestamptz default now()
);

create table if not exists competitions (
 id uuid primary key default gen_random_uuid(),
 name text not null, type text not null default 'Campeonato', created_at timestamptz default now()
);

create table if not exists teams (
 id uuid primary key default gen_random_uuid(),
 name text not null, logo_url text, competition_id uuid references competitions(id) on delete set null
);

create table if not exists games (
 id uuid primary key default gen_random_uuid(),
 game_date date not null, competition_id uuid references competitions(id) on delete set null,
 opponent_team_id uuid references teams(id) on delete set null,
 minutes_per_half int default 20, halves int default 2,
 home_score int default 0, away_score int default 0,
 status text default 'scheduled', notes text, created_at timestamptz default now()
);

create table if not exists game_squads (
 id uuid primary key default gen_random_uuid(), game_id uuid references games(id) on delete cascade,
 player_id uuid references players(id) on delete cascade, role text not null, unique(game_id,player_id)
);

create table if not exists game_events (
 id uuid primary key default gen_random_uuid(), game_id uuid references games(id) on delete cascade,
 player_id uuid references players(id) on delete set null, event_type text not null,
 minute numeric, half int, value jsonb default '{}'::jsonb, created_at timestamptz default now()
);

create table if not exists attendances (
 id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade,
 session_date date not null, status text not null default 'P',
 notes text, unique(player_id,session_date)
);

create table if not exists wellness (
 id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade,
 session_date date not null, sleep int, fatigue int, soreness int, stress int, mood int,
 unique(player_id,session_date)
);

create table if not exists pse (
 id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade,
 session_date date not null, session_type text default 'Treino', value int, unique(player_id,session_date,session_type)
);

create table if not exists evaluations (
 id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade,
 evaluation_date date not null, psychological int, physical int, tactical int, technical int,
 unique(player_id,evaluation_date)
);

create table if not exists measurements (
 id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade,
 measurement_date date not null, period text default 'Inicio', weight numeric, height numeric, hydration numeric,
 unique(player_id,measurement_date)
);

create table if not exists fines (
 id uuid primary key default gen_random_uuid(), player_id uuid references players(id) on delete cascade,
 fine_date date not null, reason text not null, amount numeric default 0, notes text
);

create table if not exists fine_reasons (
 id uuid primary key default gen_random_uuid(), name text unique not null, default_amount numeric default 0
);

alter table players enable row level security;
alter table competitions enable row level security;
alter table teams enable row level security;
alter table games enable row level security;
alter table game_squads enable row level security;
alter table game_events enable row level security;
alter table attendances enable row level security;
alter table wellness enable row level security;
alter table pse enable row level security;
alter table evaluations enable row level security;
alter table measurements enable row level security;
alter table fines enable row level security;
alter table fine_reasons enable row level security;

do $$ declare t text;
begin
 for t in select unnest(array['players','competitions','teams','games','game_squads','game_events','attendances','wellness','pse','evaluations','measurements','fines','fine_reasons'])
 loop
   execute format('drop policy if exists "public all %s" on %I',t,t);
   execute format('create policy "public all %s" on %I for all using (true) with check (true)',t,t);
 end loop;
end $$;
