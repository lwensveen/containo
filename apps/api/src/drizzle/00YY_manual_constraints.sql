-- 00YY_manual_constraints.sql
-- Manual DB constraints & indexes that Drizzle-Kit cannot (yet) express well.
-- Idempotent: safe to re-run.

-- ==============================
-- Extensions required
-- ==============================
create extension if not exists btree_gist;
create extension if not exists plpgsql;

-- ==============================
-- 1) Lane rates: prevent overlapping active windows per lane+mode
--    via GiST exclusion on a generated tstzrange
-- ==============================
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'lane_rates'
      and column_name  = 'effective_range'
  ) then
alter table lane_rates
    add column effective_range tstzrange
        generated always as (tstzrange(effective_from, effective_to, '[)')) stored;
end if;
end$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ex_lane_mode_active_no_overlap'
  ) then
alter table lane_rates
    add constraint ex_lane_mode_active_no_overlap
    exclude using gist (
        origin_port      with =,
        dest_port        with =,
        mode             with =,
        effective_range  with &&
      )
      where (active = true);
end if;
end$$;

-- Optional: also helpful to query by start time
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'idx_lane_rates_effective_from'
  ) then
create index idx_lane_rates_effective_from on lane_rates (effective_from);
end if;
end$$;

-- ==============================
-- 2) Partial indexes (moved from TS to avoid drizzle-kit JS loader issues)
-- ==============================

-- Only PENDING items per lane/cutoff (hot path for allocation)
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'idx_items_pending_lane'
  ) then
create index idx_items_pending_lane
    on pool_items (origin_port, dest_port, mode, cutoff_at)
    where status = 'pending';
end if;
end$$;

-- Only OPEN pools per lane/cutoff (finding next pool)
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'idx_pools_open_lane'
  ) then
create index idx_pools_open_lane
    on pools (origin_port, dest_port, mode, cutoff_at)
    where status = 'open';
end if;
end$$;

-- Only ACTIVE lane rates per lane (picking the top priority)
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and indexname = 'idx_lane_rates_lane_active'
  ) then
create index idx_lane_rates_lane_active
    on lane_rates (origin_port, dest_port, mode, priority)
    where active = true;
end if;
end$$;

-- ==============================
-- 3) Partial UNIQUE: at most one OPEN pool for (origin,dest,mode,cutoff_at)
--    (Leave the TS version commented; enforce here.)
-- ==============================
do $$
begin
  if not exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and indexname  = 'ux_open_pool_per_lane_cutoff'
  ) then
create unique index ux_open_pool_per_lane_cutoff
    on pools (origin_port, dest_port, mode, cutoff_at)
    where status = 'open';
end if;
end$$;

-- ==============================
-- 4) Covering indexes for common reads (INCLUDE reduces heap lookups)
--    These replace simpler versions if they already exist.
-- ==============================
do $$
begin
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_items_user_created') then
drop index idx_items_user_created;
end if;
create index idx_items_user_created
    on pool_items (user_id, created_at desc)
    include (status, origin_port, dest_port, mode, cutoff_at, volume_m3);
end$$;

do $$
begin
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='idx_pools_status_cutoff') then
drop index idx_pools_status_cutoff;
end if;
create index idx_pools_status_cutoff
    on pools (status, cutoff_at desc)
    include (origin_port, dest_port, mode, capacity_m3, used_m3);
end$$;

-- ==============================
-- 5) Pool capacity enforcement (trigger) — prevents overfilling a pool
-- ==============================

-- Helper: compute used volume in a pool (exclude refunded)
create or replace function pool_used_m3(p_pool uuid)
returns numeric
language sql
stable
as $$
select coalesce(sum(volume_m3), 0)
from pool_items
where pool_id = p_pool
  and status not in ('refunded')
    $$;

-- Trigger: reject inserts/updates that would exceed capacity
create or replace function trg_pool_items_enforce_capacity()
returns trigger
language plpgsql
as $$
declare
cap  numeric;
  used numeric;
begin
  -- If no pool assigned, nothing to enforce
  if NEW.pool_id is null then
    return NEW;
end if;

  -- Lock the pool row to serialize concurrent changes
select capacity_m3 into cap
from pools
where id = NEW.pool_id
    for update;

if cap is null then
    return NEW;
end if;

  -- Current used volume
  used := pool_used_m3(NEW.pool_id);

  -- If updating within the same pool, subtract the old value
  if TG_OP = 'UPDATE' and OLD.pool_id = NEW.pool_id then
    used := used - coalesce(OLD.volume_m3, 0);
end if;

  if used + coalesce(NEW.volume_m3, 0) > cap then
    raise exception 'Pool % capacity exceeded: used % + new % > cap %',
      NEW.pool_id, used, NEW.volume_m3, cap
      using errcode = '23514'; -- check_violation
end if;

return NEW;
end;
$$;

drop trigger if exists pool_items_enforce_capacity on pool_items;
create trigger pool_items_enforce_capacity
    before insert or update of pool_id, volume_m3, status
                     on pool_items
                         for each row
                         execute function trg_pool_items_enforce_capacity();

-- ==============================
-- 6) (Optional) Booking ref uniqueness guard (if not enforced in TS)
-- ==============================
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname='public' and indexname='ux_pools_booking_ref'
  ) then
create unique index ux_pools_booking_ref on pools (booking_ref);
end if;
end$$;
