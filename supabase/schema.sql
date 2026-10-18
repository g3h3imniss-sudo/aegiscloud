-- AegisCloud — Supabase sxemi (v2)
-- Supabase dashboard → SQL Editor → bu faylı yapışdırıb "Run" et.

create extension if not exists pgcrypto;

-- ── 1. Hash-zəncirli audit ledger ──────────────────────────────────
create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  action text not null,
  target text,
  status integer,
  tls_issuer text,
  prev_hash text,
  entry_hash text not null,
  created_at timestamptz not null default now()
);
alter table public.audit_log add column if not exists prev_hash text;

-- Audit tarixçəsi saxlanılır; bu sxem onu təmizləmir.

-- Yeni qeydi zəncirə əlavə edən funksiya (prev_hash + SHA-256 hash).
create or replace function public.append_audit_log(
  p_action text, p_target text, p_status integer, p_tls_issuer text
) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_prev text;
  v_ts timestamptz;
  v_hash text;
begin
  perform pg_advisory_xact_lock(741852963);
  v_ts := clock_timestamp();
  select entry_hash into v_prev from public.audit_log order by id desc limit 1;
  if v_prev is null then v_prev := repeat('0', 64); end if;
  v_hash := encode(digest(
    v_prev || '|' || p_action || '|' || coalesce(p_target,'') || '|' ||
    coalesce(p_status::text,'') || '|' || coalesce(p_tls_issuer,'') || '|' || v_ts::text,
    'sha256'), 'hex');
  insert into public.audit_log(action, target, status, tls_issuer, prev_hash, entry_hash, created_at)
  values (p_action, p_target, p_status, p_tls_issuer, v_prev, v_hash, v_ts);
end; $$;
revoke all on function public.append_audit_log(text, text, integer, text) from public, anon, authenticated;
grant execute on function public.append_audit_log(text, text, integer, text) to service_role;

-- Bütün zənciri yoxlayan funksiya: pozulduğu yeri qaytarır.
create or replace function public.verify_audit_chain()
returns table(total integer, valid boolean, broken_id bigint)
language plpgsql security definer set search_path = public, extensions as $$
declare
  r record;
  v_prev text := repeat('0', 64);
  v_total integer := 0;
  v_re text;
begin
  for r in select * from public.audit_log order by id asc loop
    v_total := v_total + 1;
    if r.prev_hash is distinct from v_prev then
      return query select v_total, false, r.id; return;
    end if;
    v_re := encode(digest(
      v_prev || '|' || r.action || '|' || coalesce(r.target,'') || '|' ||
      coalesce(r.status::text,'') || '|' || coalesce(r.tls_issuer,'') || '|' || r.created_at::text,
      'sha256'), 'hex');
    if v_re is distinct from r.entry_hash then
      return query select v_total, false, r.id; return;
    end if;
    v_prev := r.entry_hash;
  end loop;
  return query select v_total, true, null::bigint;
end; $$;
revoke all on function public.verify_audit_chain() from public, anon, authenticated;
grant execute on function public.verify_audit_chain() to service_role;

-- ── 2. İSMS risk qeydiyyatı ────────────────────────────────────────
create table if not exists public.risks (
  id bigint generated always as identity primary key,
  asset text not null,
  threat text not null,
  likelihood integer not null check (likelihood between 1 and 5),
  impact integer not null check (impact between 1 and 5),
  control text,
  created_at timestamptz not null default now()
);

insert into public.risks (asset, threat, likelihood, impact, control)
select * from (values
  ('Cloudflare R2 bucket', 'Yanlış konfiqurasiya, public giriş', 2, 5, 'Private bucket + məhdud API tokeni'),
  ('Cloudflare R2 API tokeni', 'Həddindən artıq icazə (over-privilege)', 3, 4, 'Tək bucket üçün read/write scope'),
  ('İstifadəçi parolları', 'Brute-force / credential stuffing', 4, 4, 'Argon2id + rate limit + MFA'),
  ('API', 'BOLA (obyekt səviyyəli avtorizasiya)', 3, 5, 'hər sorğuda sahiblik yoxlaması'),
  ('Audit logları', 'Logların dəyişdirilməsi', 2, 4, 'hash-zəncirli ledger')
) as v(asset, threat, likelihood, impact, control)
where not exists (select 1 from public.risks);

-- ── 3. RLS ─────────────────────────────────────────────────────────
-- RLS aktiv, public policy yoxdur. Bütün giriş server tərəfdə,
-- service-role açarı ilə aparılır.
alter table public.audit_log enable row level security;
alter table public.risks enable row level security;

-- ── 4. Object-storage recovery-monitor baseline and change history ─
-- Legacy s3_* tables, if previously created, are intentionally left untouched.
create table if not exists public.object_baseline (
  bucket text not null,
  object_key text not null,
  etag text,
  size bigint not null,
  last_modified timestamptz,
  baseline_at timestamptz not null default now(),
  primary key (bucket, object_key)
);

create table if not exists public.object_baseline_state (
  bucket text primary key,
  baseline_at timestamptz not null default now(),
  object_count integer not null
);

create table if not exists public.object_change_events (
  id bigint generated always as identity primary key,
  event_id text,
  bucket text not null,
  object_key text not null,
  change_type text not null check (change_type in ('added', 'modified', 'deleted')),
  previous_etag text,
  current_etag text,
  source text not null default 'baseline-scan',
  actor text,
  request_id text,
  observed_at timestamptz not null default now()
);
create unique index if not exists object_change_events_event_id_idx
  on public.object_change_events(event_id) where event_id is not null;
create index if not exists object_change_events_bucket_observed_idx
  on public.object_change_events (bucket, observed_at desc);

alter table public.object_baseline enable row level security;
alter table public.object_baseline_state enable row level security;
alter table public.object_change_events enable row level security;

create or replace function public.replace_object_baseline(p_bucket text, p_objects jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  delete from public.object_baseline where bucket = p_bucket;
  insert into public.object_baseline(bucket, object_key, etag, size, last_modified, baseline_at)
  select p_bucket, object_key, etag, size, last_modified, now()
  from jsonb_to_recordset(p_objects) as item(
    object_key text,
    etag text,
    size bigint,
    last_modified timestamptz
  );
  get diagnostics v_count = row_count;
  insert into public.object_baseline_state(bucket, baseline_at, object_count)
  values (p_bucket, now(), v_count)
  on conflict (bucket) do update
    set baseline_at = excluded.baseline_at, object_count = excluded.object_count;
  return v_count;
end; $$;
revoke all on function public.replace_object_baseline(text, jsonb) from public, anon, authenticated;
grant execute on function public.replace_object_baseline(text, jsonb) to service_role;
