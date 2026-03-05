-- WS3 setup for Supabase project
-- Bucket, storage policies, and realtime publication.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'feeding-point-photos',
  'feeding-point-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'public_read_feeding_point_photos'
  ) then
    execute $p$
      create policy public_read_feeding_point_photos
      on storage.objects
      for select
      to public
      using (bucket_id = 'feeding-point-photos');
    $p$;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'authenticated_upload_feeding_point_photos'
  ) then
    execute $p$
      create policy authenticated_upload_feeding_point_photos
      on storage.objects
      for insert
      to authenticated
      with check (
        bucket_id = 'feeding-point-photos'
        and owner = auth.uid()
      );
    $p$;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'feeding_points'
  ) then
    alter publication supabase_realtime add table public.feeding_points;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'feeding_updates'
  ) then
    alter publication supabase_realtime add table public.feeding_updates;
  end if;
end;
$$;

commit;
