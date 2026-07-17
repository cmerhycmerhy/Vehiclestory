-- VehicleStory rate limiting
-- Run this in the Supabase SQL editor.

-- Fixed-window rate limit counters, keyed by an arbitrary string (IP,
-- user id, etc., prefixed per feature). No RLS policies are defined —
-- only the security-definer function below touches this table, so it's
-- unreachable directly by anon/authenticated roles regardless.
create table if not exists rate_limits (
  key          text primary key,
  count        integer not null default 1,
  window_start timestamptz not null default now()
);

alter table rate_limits enable row level security;

-- Atomically checks and increments a fixed-window counter. Returns true
-- if the request is allowed, false if the caller has hit the limit.
-- security definer + explicit search_path so it can read/write
-- rate_limits despite that table having no RLS policies of its own.
create or replace function check_rate_limit(
  p_key text,
  p_max_requests integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_window_start timestamptz;
begin
  select count, window_start into v_count, v_window_start
  from rate_limits
  where key = p_key
  for update;

  if not found then
    insert into rate_limits (key, count, window_start)
    values (p_key, 1, now());
    return true;
  end if;

  if now() - v_window_start > (p_window_seconds || ' seconds')::interval then
    update rate_limits
    set count = 1, window_start = now()
    where key = p_key;
    return true;
  end if;

  if v_count >= p_max_requests then
    return false;
  end if;

  update rate_limits
  set count = count + 1
  where key = p_key;
  return true;
end;
$$;

grant execute on function check_rate_limit(text, integer, integer)
  to anon, authenticated;
