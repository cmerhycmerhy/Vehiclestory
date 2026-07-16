-- VehicleStory photo storage setup
-- Run this in the Supabase SQL editor, after schema.sql and storage.sql.

-- Public bucket for album photos — these are meant to be shown on public
-- album pages once an entry is published, so unlike proof-documents this
-- bucket serves objects directly with no auth required.
insert into storage.buckets (id, name, public)
values ('vehicle-photos', 'vehicle-photos', true)
on conflict (id) do nothing;

-- Files are stored under `${chapter_id}/${filename}`. Ownership is verified
-- by joining back to ownership_chapters rather than a path-prefix check,
-- since the path is keyed by chapter, not by user.
create policy "Owners can upload photos for their own chapters"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from ownership_chapters c
      where c.id::text = (storage.foldername(name))[1]
        and c.user_id = auth.uid()
    )
  );

create policy "Owners can update photos for their own chapters"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from ownership_chapters c
      where c.id::text = (storage.foldername(name))[1]
        and c.user_id = auth.uid()
    )
  );

create policy "Owners can delete photos for their own chapters"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'vehicle-photos'
    and exists (
      select 1 from ownership_chapters c
      where c.id::text = (storage.foldername(name))[1]
        and c.user_id = auth.uid()
    )
  );
