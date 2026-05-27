-- ============================================
-- Sprint 1: athletes, athlete_highlights
-- Sprint 3 prep: event_results, participation_scores
-- ============================================

-- ---- athletes ----
create table athletes (
  id text primary key,
  event_slug text not null,
  gender text not null check (gender in ('male', 'female')),
  name text not null,
  mark numeric not null default 0,
  image_url text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_athletes_event_gender on athletes(event_slug, gender);

alter table athletes enable row level security;

create policy "Athletes are publicly readable"
  on athletes for select
  to anon, authenticated
  using (true);

create policy "Only service role can modify athletes"
  on athletes for all
  to service_role
  using (true)
  with check (true);

-- ---- athlete_highlights ----
create table athlete_highlights (
  id uuid primary key default gen_random_uuid(),
  athlete_id text not null references athletes(id) on delete cascade,
  tier text not null check (tier in ('gold', 'silver', 'bronze')),
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_highlights_athlete on athlete_highlights(athlete_id);

alter table athlete_highlights enable row level security;

create policy "Highlights are publicly readable"
  on athlete_highlights for select
  to anon, authenticated
  using (true);

create policy "Only service role can modify highlights"
  on athlete_highlights for all
  to service_role
  using (true)
  with check (true);

-- ---- event_results ----
create table event_results (
  id uuid primary key default gen_random_uuid(),
  event_slug text not null,
  athlete_id text not null references athletes(id) on delete cascade,
  mark numeric,
  position integer,
  updated_at timestamptz not null default now(),
  constraint unique_event_athlete unique(event_slug, athlete_id)
);

create index idx_event_results_event on event_results(event_slug);

alter table event_results enable row level security;

create policy "Event results are publicly readable"
  on event_results for select
  to anon, authenticated
  using (true);

create policy "Only service role can modify event results"
  on event_results for all
  to service_role
  using (true)
  with check (true);

-- ---- participation_scores ----
create table participation_scores (
  id uuid primary key default gen_random_uuid(),
  participation_id uuid not null references participations(id) on delete cascade,
  total_score numeric not null default 0,
  breakdown jsonb not null default '{}',
  calculated_at timestamptz not null default now(),
  constraint unique_participation_score unique(participation_id)
);

alter table participation_scores enable row level security;

create policy "Participation scores are publicly readable"
  on participation_scores for select
  to anon, authenticated
  using (true);

create policy "Only service role can modify participation scores"
  on participation_scores for all
  to service_role
  using (true)
  with check (true);

-- ---- updated_at trigger ----
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger athletes_updated_at
  before update on athletes
  for each row execute function update_updated_at();

create trigger event_results_updated_at
  before update on event_results
  for each row execute function update_updated_at();

-- ---- Storage bucket for athlete images ----
insert into storage.buckets (id, name, public)
values ('athlete-images', 'athlete-images', true)
on conflict (id) do nothing;

create policy "Public read access for athlete images"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'athlete-images');

create policy "Service role can upload athlete images"
  on storage.objects for insert
  to service_role
  with check (bucket_id = 'athlete-images');

create policy "Service role can delete athlete images"
  on storage.objects for delete
  to service_role
  using (bucket_id = 'athlete-images');