begin;

create or replace function public.get_feeding_points_in_bbox(
  min_lat double precision,
  max_lat double precision,
  min_lng double precision,
  max_lng double precision,
  viewer_lat double precision default null,
  viewer_lng double precision default null,
  stale_after_hours integer default 24
)
returns table (
  id uuid,
  name text,
  description text,
  status feeding_status,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz,
  is_stale boolean,
  distance_meters double precision
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fp.id,
    fp.name,
    fp.description,
    fp.status,
    st_y(fp.location::geometry) as latitude,
    st_x(fp.location::geometry) as longitude,
    fp.updated_at,
    fp.updated_at < now() - make_interval(hours => greatest(stale_after_hours, 1)) as is_stale,
    case
      when viewer_lat is null or viewer_lng is null then null
      else st_distance(
        fp.location,
        st_setsrid(st_makepoint(viewer_lng, viewer_lat), 4326)::geography
      )
    end as distance_meters
  from public.feeding_points fp
  where fp.is_active = true
    and st_intersects(
      fp.location::geometry,
      st_makeenvelope(min_lng, min_lat, max_lng, max_lat, 4326)
    )
  order by fp.updated_at desc;
$$;

grant execute on function public.get_feeding_points_in_bbox(
  double precision,
  double precision,
  double precision,
  double precision,
  double precision,
  double precision,
  integer
) to anon, authenticated;

create or replace function public.get_feeding_point_overview(
  p_point_id uuid
)
returns table (
  id uuid,
  name text,
  description text,
  status feeding_status,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz,
  last_update_at timestamptz,
  distinct_volunteers bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    fp.id,
    fp.name,
    fp.description,
    fp.status,
    st_y(fp.location::geometry) as latitude,
    st_x(fp.location::geometry) as longitude,
    fp.updated_at,
    (
      select max(fu.created_at)
      from public.feeding_updates fu
      where fu.point_id = fp.id
    ) as last_update_at,
    (
      select count(distinct fu.user_id)
      from public.feeding_updates fu
      where fu.point_id = fp.id
    ) as distinct_volunteers
  from public.feeding_points fp
  where fp.id = p_point_id
    and fp.is_active = true
  limit 1;
$$;

grant execute on function public.get_feeding_point_overview(uuid) to anon, authenticated;

commit;
