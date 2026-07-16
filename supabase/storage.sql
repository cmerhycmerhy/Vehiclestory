-- VehicleStory storage setup
-- Run this in the Supabase SQL editor, after schema.sql.

-- Private bucket for ownership proof documents (title, registration, bill of
-- sale, etc.). Never public — proof_document_path is never exposed in any
-- public-facing select policy in schema.sql either.
insert into storage.buckets (id, name, public)
values ('proof-documents', 'proof-documents', false)
on conflict (id) do nothing;

-- storage.objects already has RLS enabled by default on every Supabase
-- project, and the SQL editor's role doesn't own that table, so don't
-- try to ALTER it here — just add the policies.

-- Files are stored under `${auth.uid()}/...`, so ownership is just a path
-- prefix check.
create policy "Owners can upload their own proof documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can read their own proof documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Owners can delete their own proof documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'proof-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
