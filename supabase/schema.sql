create extension if not exists pgcrypto;

create table if not exists public.agents (
  id bigint primary key,
  name text not null,
  phone text not null default '',
  email text not null default '',
  market text not null default '',
  type text not null default 'Agent',
  next_follow_up date,
  last_contacted_at date,
  added_at date not null default current_date,
  notes text not null default '',
  auto_follow_up boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.preforeclosure_leads (
  id bigint primary key,
  name text not null,
  address text not null,
  county text not null default '',
  phone text not null default '',
  email text not null default '',
  stage text not null default 'Early Warning',
  manual_override_stage text,
  auction_date date not null,
  score integer not null default 0,
  status text not null default 'Not contacted',
  notes text not null default '',
  created_at date not null default current_date,
  next_follow_up date,
  follow_ups jsonb not null default '[]'::jsonb,
  calls integer not null default 0,
  texts integer not null default 0,
  lat double precision,
  lng double precision,
  source text not null default 'Manual',
  manual_rank bigint not null default 0,
  auto_follow_up boolean not null default true,
  postponed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.deleted_agents (
  id bigint primary key,
  name text not null,
  payload jsonb not null,
  deleted_at timestamptz not null default now()
);

create table if not exists public.deleted_leads (
  id bigint primary key,
  address text not null,
  payload jsonb not null,
  deleted_at timestamptz not null default now()
);

create table if not exists public.settings (
  id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.notes (
  entity_type text not null,
  entity_id text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists public.follow_up_dates (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  follow_up_date date,
  label text not null default '',
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.call_text_counts (
  entity_type text not null,
  entity_id text not null,
  calls integer not null default 0,
  texts integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists public.statuses (
  entity_type text not null,
  entity_id text not null,
  status text not null default '',
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists public.map_coordinates (
  entity_type text not null,
  entity_id text not null,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists public.timeline_events (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  event_date date not null,
  label text not null default '',
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_preforeclosure_leads_manual_rank
  on public.preforeclosure_leads (manual_rank desc);

create index if not exists idx_preforeclosure_leads_address
  on public.preforeclosure_leads (address);

create index if not exists idx_agents_name
  on public.agents (name);

create index if not exists idx_follow_up_dates_entity
  on public.follow_up_dates (entity_type, entity_id);

create index if not exists idx_timeline_events_entity
  on public.timeline_events (entity_type, entity_id);

alter table public.agents disable row level security;
alter table public.preforeclosure_leads disable row level security;
alter table public.deleted_agents disable row level security;
alter table public.deleted_leads disable row level security;
alter table public.settings disable row level security;
alter table public.notes disable row level security;
alter table public.follow_up_dates disable row level security;
alter table public.call_text_counts disable row level security;
alter table public.statuses disable row level security;
alter table public.map_coordinates disable row level security;
alter table public.timeline_events disable row level security;

do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
  ) then
    begin
      alter publication supabase_realtime add table public.agents;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.preforeclosure_leads;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.deleted_agents;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.deleted_leads;
    exception when duplicate_object then null;
    end;

    begin
      alter publication supabase_realtime add table public.settings;
    exception when duplicate_object then null;
    end;
  end if;
end
$$;
