-- Foundation schema for Meu Caramelo
-- Portable for local Docker Postgres and future Supabase migration flow.

begin;

create extension if not exists pgcrypto;
create extension if not exists postgis;

create schema if not exists auth;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth'
      and p.proname = 'uid'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute format(
      'create function auth.uid()
        returns uuid
        language sql
        stable
        as %L',
      'select nullif(current_setting(''request.jwt.claim.sub'', true), '''')::uuid'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'auth'
      and p.proname = 'role'
      and pg_get_function_identity_arguments(p.oid) = ''
  ) then
    execute format(
      'create function auth.role()
        returns text
        language sql
        stable
        as %L',
      'select coalesce(nullif(current_setting(''request.jwt.claim.role'', true), ''''), ''anon'')'
    );
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'feeding_status'
  ) then
    create type feeding_status as enum ('full', 'empty', 'unknown');
  end if;
end;
$$;

create table if not exists public.users (
  id uuid primary key,
  display_name text,
  avatar_url text,
  reputation_points integer not null default 0 check (reputation_points >= 0),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feeding_points (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.users(id) on delete set null,
  name text not null,
  description text,
  status feeding_status not null default 'unknown',
  location geography(point, 4326) not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feeding_updates (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.feeding_points(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status feeding_status not null,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.feeding_photos (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.feeding_points(id) on delete cascade,
  update_id uuid references public.feeding_updates(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  storage_path text not null,
  validation_status text not null default 'pending'
    check (validation_status in ('pending', 'approved', 'suspect', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_feeding_points_location
  on public.feeding_points using gist (location);
create index if not exists idx_feeding_points_status
  on public.feeding_points (status);
create index if not exists idx_feeding_updates_point_created_at
  on public.feeding_updates (point_id, created_at desc);
create index if not exists idx_feeding_updates_user_created_at
  on public.feeding_updates (user_id, created_at desc);
create index if not exists idx_feeding_photos_point_created_at
  on public.feeding_photos (point_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists feeding_points_set_updated_at on public.feeding_points;
create trigger feeding_points_set_updated_at
before update on public.feeding_points
for each row
execute function public.set_updated_at();

create or replace function public.guard_update_rate_limit()
returns trigger
language plpgsql
as $$
declare
  has_recent boolean;
begin
  select exists (
    select 1
    from public.feeding_updates fu
    where fu.point_id = new.point_id
      and fu.user_id = new.user_id
      and fu.created_at >= now() - interval '2 minutes'
  ) into has_recent;

  if has_recent then
    raise exception 'rate_limit: only one update per user/point each 2 minutes';
  end if;

  return new;
end;
$$;

drop trigger if exists feeding_updates_rate_limit on public.feeding_updates;
create trigger feeding_updates_rate_limit
before insert on public.feeding_updates
for each row
execute function public.guard_update_rate_limit();

alter table public.users enable row level security;
alter table public.feeding_points enable row level security;
alter table public.feeding_updates enable row level security;
alter table public.feeding_photos enable row level security;

drop policy if exists users_select_self_or_admin on public.users;
create policy users_select_self_or_admin
on public.users
for select
to public
using (
  id = auth.uid()
  or exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin)
);

drop policy if exists users_insert_self on public.users;
create policy users_insert_self
on public.users
for insert
to public
with check (id = auth.uid());

drop policy if exists users_update_self_or_admin on public.users;
create policy users_update_self_or_admin
on public.users
for update
to public
using (
  id = auth.uid()
  or exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin)
)
with check (
  id = auth.uid()
  or exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin)
);

drop policy if exists feeding_points_read_public on public.feeding_points;
create policy feeding_points_read_public
on public.feeding_points
for select
to public
using (is_active = true);

drop policy if exists feeding_points_insert_authenticated on public.feeding_points;
create policy feeding_points_insert_authenticated
on public.feeding_points
for insert
to public
with check (auth.uid() is not null and created_by = auth.uid());

drop policy if exists feeding_points_update_owner_or_admin on public.feeding_points;
create policy feeding_points_update_owner_or_admin
on public.feeding_points
for update
to public
using (
  created_by = auth.uid()
  or exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin)
)
with check (
  created_by = auth.uid()
  or exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin)
);

drop policy if exists feeding_updates_read_public on public.feeding_updates;
create policy feeding_updates_read_public
on public.feeding_updates
for select
to public
using (true);

drop policy if exists feeding_updates_insert_authenticated on public.feeding_updates;
create policy feeding_updates_insert_authenticated
on public.feeding_updates
for insert
to public
with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists feeding_photos_read_public on public.feeding_photos;
create policy feeding_photos_read_public
on public.feeding_photos
for select
to public
using (true);

drop policy if exists feeding_photos_insert_authenticated on public.feeding_photos;
create policy feeding_photos_insert_authenticated
on public.feeding_photos
for insert
to public
with check (auth.uid() is not null and user_id = auth.uid());

drop policy if exists feeding_points_delete_admin on public.feeding_points;
create policy feeding_points_delete_admin
on public.feeding_points
for delete
to public
using (exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin));

drop policy if exists feeding_updates_delete_admin on public.feeding_updates;
create policy feeding_updates_delete_admin
on public.feeding_updates
for delete
to public
using (exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin));

drop policy if exists feeding_photos_delete_admin on public.feeding_photos;
create policy feeding_photos_delete_admin
on public.feeding_photos
for delete
to public
using (exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin));

commit;
