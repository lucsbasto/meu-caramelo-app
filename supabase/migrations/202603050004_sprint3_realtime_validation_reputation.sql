begin;

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'reputation_event_type'
  ) then
    create type public.reputation_event_type as enum ('status_update', 'refill_confirmed');
  end if;
end;
$$;

alter table public.feeding_photos
  add column if not exists validation_reason text,
  add column if not exists validated_at timestamptz;

create table if not exists public.photo_validation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.feeding_photos(id) on delete cascade,
  point_id uuid not null references public.feeding_points(id) on delete cascade,
  update_id uuid references public.feeding_updates(id) on delete set null,
  user_id uuid not null references public.users(id) on delete cascade,
  decision text not null check (decision in ('approved', 'suspect', 'rejected')),
  confidence numeric(5, 2),
  reason text,
  provider text not null default 'heuristic-v1',
  raw_response jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_photo_validation_audit_logs_photo_id
  on public.photo_validation_audit_logs (photo_id, created_at desc);

create table if not exists public.reputation_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type public.reputation_event_type not null,
  points_delta integer not null check (points_delta > 0),
  update_id uuid references public.feeding_updates(id) on delete set null,
  photo_id uuid references public.feeding_photos(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_reputation_status_update
  on public.reputation_ledger (event_type, update_id)
  where event_type = 'status_update' and update_id is not null;

create unique index if not exists uq_reputation_refill_confirmed
  on public.reputation_ledger (event_type, photo_id)
  where event_type = 'refill_confirmed' and photo_id is not null;

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  source text not null default 'client' check (source in ('client', 'edge', 'system')),
  user_id uuid references public.users(id) on delete set null,
  point_id uuid references public.feeding_points(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_product_events_event_name_created_at
  on public.product_events (event_name, created_at desc);

create index if not exists idx_product_events_source_created_at
  on public.product_events (source, created_at desc);

create or replace function public.ensure_public_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;

  insert into public.users (id)
  values (p_user_id)
  on conflict (id) do nothing;
end;
$$;

grant execute on function public.ensure_public_user(uuid) to anon, authenticated;

create or replace function public.track_event(
  p_event_name text,
  p_source text default 'client',
  p_user_id uuid default null,
  p_point_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_event_id uuid;
  resolved_user_id uuid;
begin
  resolved_user_id := coalesce(p_user_id, auth.uid());

  perform public.ensure_public_user(resolved_user_id);

  insert into public.product_events (
    event_name,
    source,
    user_id,
    point_id,
    metadata
  )
  values (
    p_event_name,
    case when p_source in ('client', 'edge', 'system') then p_source else 'client' end,
    resolved_user_id,
    p_point_id,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into next_event_id;

  return next_event_id;
end;
$$;

grant execute on function public.track_event(text, text, uuid, uuid, jsonb) to anon, authenticated;

create or replace function public.award_reputation(
  p_user_id uuid,
  p_points integer,
  p_event_type public.reputation_event_type,
  p_update_id uuid default null,
  p_photo_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count integer;
begin
  if p_user_id is null or p_points <= 0 then
    return;
  end if;

  perform public.ensure_public_user(p_user_id);

  insert into public.reputation_ledger (
    user_id,
    event_type,
    points_delta,
    update_id,
    photo_id
  )
  values (
    p_user_id,
    p_event_type,
    p_points,
    p_update_id,
    p_photo_id
  )
  on conflict do nothing;

  get diagnostics inserted_count = row_count;

  if inserted_count = 1 then
    update public.users
    set reputation_points = reputation_points + p_points
    where id = p_user_id;
  end if;
end;
$$;

grant execute on function public.award_reputation(uuid, integer, public.reputation_event_type, uuid, uuid) to anon, authenticated;

create or replace function public.on_feeding_update_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.ensure_public_user(new.user_id);
  perform public.award_reputation(new.user_id, 2, 'status_update', new.id, null);
  perform public.track_event(
    'update_submitted',
    'system',
    new.user_id,
    new.point_id,
    jsonb_build_object('status', new.status)
  );
  return new;
end;
$$;

drop trigger if exists trg_on_feeding_update_created on public.feeding_updates;
create trigger trg_on_feeding_update_created
after insert on public.feeding_updates
for each row
execute function public.on_feeding_update_created();

create or replace function public.on_feeding_photo_validated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  update_status public.feeding_status;
begin
  if new.validation_status = old.validation_status then
    return new;
  end if;

  if new.validation_status = 'approved' and new.update_id is not null then
    select fu.status
    into update_status
    from public.feeding_updates fu
    where fu.id = new.update_id;

    if update_status = 'full' then
      perform public.award_reputation(new.user_id, 10, 'refill_confirmed', new.update_id, new.id);
    end if;
  end if;

  perform public.track_event(
    'photo_validation_' || new.validation_status,
    'system',
    new.user_id,
    new.point_id,
    jsonb_build_object('photo_id', new.id, 'update_id', new.update_id)
  );

  return new;
end;
$$;

drop trigger if exists trg_on_feeding_photo_validated on public.feeding_photos;
create trigger trg_on_feeding_photo_validated
after update of validation_status on public.feeding_photos
for each row
execute function public.on_feeding_photo_validated();

create or replace view public.product_metrics_dashboard as
select
  date_trunc('day', created_at) as day,
  count(*) filter (where event_name = 'update_submitted') as updates_submitted,
  count(*) filter (where event_name = 'photo_validation_approved') as photos_approved,
  count(*) filter (where event_name = 'photo_validation_suspect') as photos_suspect,
  count(*) filter (where event_name = 'photo_validation_rejected') as photos_rejected,
  count(*) filter (where event_name = 'client_error') as client_errors,
  count(*) filter (where event_name = 'edge_error') as edge_errors
from public.product_events
group by 1
order by 1 desc;

alter table public.photo_validation_audit_logs enable row level security;
alter table public.reputation_ledger enable row level security;
alter table public.product_events enable row level security;

drop policy if exists photo_validation_audit_admin_read on public.photo_validation_audit_logs;
create policy photo_validation_audit_admin_read
on public.photo_validation_audit_logs
for select
to public
using (exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin));

drop policy if exists reputation_ledger_self_or_admin_read on public.reputation_ledger;
create policy reputation_ledger_self_or_admin_read
on public.reputation_ledger
for select
to public
using (
  user_id = auth.uid()
  or exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin)
);

drop policy if exists product_events_self_or_admin_read on public.product_events;
create policy product_events_self_or_admin_read
on public.product_events
for select
to public
using (
  user_id = auth.uid()
  or exists (select 1 from public.users me where me.id = auth.uid() and me.is_admin)
);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'feeding_photos'
  ) then
    alter publication supabase_realtime add table public.feeding_photos;
  end if;
end;
$$;

commit;
