create table if not exists agents (
  id bigint primary key,
  name text not null,
  phone text default '',
  email text default '',
  market text default '',
  type text default 'Agent',
  next_follow_up date,
  last_contacted_at date,
  added_at date not null default current_date,
  notes text default '',
  auto_follow_up boolean not null default true
);

create table if not exists preforeclosure_leads (
  id bigint primary key,
  name text not null,
  address text not null,
  county text default '',
  phone text default '',
  email text default '',
  stage text default 'Early Warning',
  manual_override_stage text,
  auction_date date not null,
  score integer not null default 0,
  status text default 'Not contacted',
  notes text default '',
  created_at date not null default current_date,
  next_follow_up date,
  follow_ups jsonb not null default '[]'::jsonb,
  calls integer not null default 0,
  texts integer not null default 0,
  lat double precision,
  lng double precision,
  source text default 'Manual',
  manual_rank bigint not null default 0,
  auto_follow_up boolean not null default true,
  postponed boolean not null default false
);

create table if not exists deleted_agents (
  id bigint primary key,
  name text not null,
  payload jsonb not null,
  deleted_at timestamptz not null default now()
);

create table if not exists deleted_leads (
  id bigint primary key,
  address text not null,
  payload jsonb not null,
  deleted_at timestamptz not null default now()
);

create table if not exists notes (
  entity_type text not null,
  entity_id text not null,
  content text default '',
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists follow_up_dates (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  follow_up_date date,
  label text default '',
  completed boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists call_text_counts (
  entity_type text not null,
  entity_id text not null,
  calls integer not null default 0,
  texts integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists statuses (
  entity_type text not null,
  entity_id text not null,
  status text default '',
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists map_coordinates (
  entity_type text not null,
  entity_id text not null,
  lat double precision,
  lng double precision,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id)
);

create table if not exists timeline_events (
  id text primary key,
  entity_type text not null,
  entity_id text not null,
  event_date date not null,
  label text default '',
  completed boolean not null default false
);

create table if not exists user_settings (
  id text primary key,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter publication supabase_realtime add table agents;
alter publication supabase_realtime add table preforeclosure_leads;
alter publication supabase_realtime add table deleted_agents;
alter publication supabase_realtime add table deleted_leads;
alter publication supabase_realtime add table user_settings;
