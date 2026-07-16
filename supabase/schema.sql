-- VehicleStory database schema
-- Run this in the Supabase SQL editor.

-- ============================================================
-- Extensions
-- ============================================================
create extension if not exists pgcrypto;

-- ============================================================
-- Tables
-- ============================================================

create table if not exists vehicles (
  id                 uuid primary key default gen_random_uuid(),
  vin                varchar(17) unique not null,
  year               integer,
  make               varchar(100),
  model              varchar(100),
  trim               varchar(200),
  body_style         varchar(100),
  engine             varchar(200),
  country_of_origin  varchar(100),
  nhtsa_data         jsonb,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists ownership_chapters (
  id                      uuid primary key default gen_random_uuid(),
  vehicle_id              uuid references vehicles(id) on delete cascade,
  user_id                 uuid references auth.users(id) on delete cascade,
  relationship_type       varchar(50) not null,
  started_at              date,
  ended_at                date,
  is_current              boolean default false,
  proof_document_path     text,
  proof_document_type     varchar(100),
  connection_description  text,
  created_at              timestamptz default now()
);

create table if not exists album_entries (
  id                      uuid primary key default gen_random_uuid(),
  chapter_id              uuid references ownership_chapters(id) on delete cascade,
  vehicle_id              uuid references vehicles(id) on delete cascade,
  relationship_label      varchar(100),
  acquisition_month       integer,
  acquisition_year        integer,
  acquisition_mileage     integer,
  mileage_unknown         boolean default false,
  nickname                varchar(200),
  origin_story            text,
  what_i_love             text,
  best_memory             text,
  events_attended         text,
  no_events                boolean default false,
  modifications           text[],
  condition_description   text,
  location_city           varchar(100),
  location_state          varchar(50),
  anything_else           text,
  section_a_complete      boolean default false,
  section_b_complete      boolean default false,
  section_c_complete      boolean default false,
  is_published             boolean default false,
  published_at             timestamptz,
  draft_saved_at            timestamptz default now(),
  created_at               timestamptz default now(),
  updated_at                timestamptz default now()
);

create table if not exists album_photos (
  id                 uuid primary key default gen_random_uuid(),
  chapter_id         uuid references ownership_chapters(id) on delete cascade,
  vehicle_id         uuid references vehicles(id) on delete cascade,
  storage_path       text not null,
  public_url         text not null,
  cover_crop_url     text,
  is_cover           boolean default false,
  display_order      integer default 0,
  caption            varchar(140),
  photo_month        integer,
  photo_year         integer,
  file_size_bytes    integer,
  original_filename  varchar(255),
  created_at         timestamptz default now()
);

-- ============================================================
-- updated_at triggers
-- ============================================================

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on vehicles;
create trigger set_updated_at
  before update on vehicles
  for each row execute function set_updated_at();

drop trigger if exists set_updated_at on album_entries;
create trigger set_updated_at
  before update on album_entries
  for each row execute function set_updated_at();

-- ============================================================
-- Indexes
-- ============================================================

-- vehicles.vin already has a unique constraint above, which Postgres
-- backs with a btree index automatically — no separate index needed.
create index if not exists idx_ownership_chapters_vehicle_id on ownership_chapters(vehicle_id);
create index if not exists idx_ownership_chapters_user_id on ownership_chapters(user_id);
create index if not exists idx_album_photos_chapter_id on album_photos(chapter_id);
create index if not exists idx_album_photos_vehicle_id on album_photos(vehicle_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table vehicles enable row level security;
alter table ownership_chapters enable row level security;
alter table album_entries enable row level security;
alter table album_photos enable row level security;

-- vehicles: public read. Writes go through the service role key
-- (server-side NHTSA lookups), so no insert/update policy is defined here.
create policy "vehicles are publicly readable"
  on vehicles for select
  to anon, authenticated
  using (true);

-- ownership_chapters: never public. proof_document_path / proof_document_type
-- live only on this table, and no select policy below exposes them to anon.
create policy "owners can read their own chapters"
  on ownership_chapters for select
  to authenticated
  using (user_id = auth.uid());

create policy "owners can insert their own chapters"
  on ownership_chapters for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "owners can update their own chapters"
  on ownership_chapters for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- album_entries: public can read published entries; owners can read/write
-- their own drafts and published entries via the parent chapter's user_id.
create policy "published entries are publicly readable"
  on album_entries for select
  to anon, authenticated
  using (is_published = true);

create policy "owners can read their own entries"
  on album_entries for select
  to authenticated
  using (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_entries.chapter_id
        and c.user_id = auth.uid()
    )
  );

create policy "owners can insert their own entries"
  on album_entries for insert
  to authenticated
  with check (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_entries.chapter_id
        and c.user_id = auth.uid()
    )
  );

create policy "owners can update their own entries"
  on album_entries for update
  to authenticated
  using (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_entries.chapter_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_entries.chapter_id
        and c.user_id = auth.uid()
    )
  );

-- album_photos: public can read photos belonging to a chapter that has at
-- least one published entry; owners can read/write their own chapter's photos.
create policy "photos for published entries are publicly readable"
  on album_photos for select
  to anon, authenticated
  using (
    exists (
      select 1 from album_entries e
      where e.chapter_id = album_photos.chapter_id
        and e.is_published = true
    )
  );

create policy "owners can read their own photos"
  on album_photos for select
  to authenticated
  using (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_photos.chapter_id
        and c.user_id = auth.uid()
    )
  );

create policy "owners can insert their own photos"
  on album_photos for insert
  to authenticated
  with check (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_photos.chapter_id
        and c.user_id = auth.uid()
    )
  );

create policy "owners can update their own photos"
  on album_photos for update
  to authenticated
  using (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_photos.chapter_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from ownership_chapters c
      where c.id = album_photos.chapter_id
        and c.user_id = auth.uid()
    )
  );
