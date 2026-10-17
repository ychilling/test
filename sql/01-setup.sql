-- 疼痛管理系統：完整 Supabase Schema / RLS / RPC
-- 可重複執行設計以本專案全新資料庫為主；正式環境請先備份。

create extension if not exists pgcrypto;
create schema if not exists private;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pain_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_code text not null,
  nrs smallint not null check (nrs between 0 and 10),
  location text not null check (char_length(location) between 1 and 100),
  location_other text,
  qualities text[] not null default '{}',
  quality_other text,
  frequency text not null check (frequency in ('持續性','間歇性','偶發性')),
  pain_started_at timestamptz not null,
  duration_value numeric(10,2) not null check (duration_value > 0),
  duration_unit text not null check (duration_unit in ('分鐘','小時','天','週')),
  notes text,
  status text not null default 'pending_intervention' check (status in ('pending_intervention','pending_reassessment','completed')),
  intervention_methods text[] not null default '{}',
  intervention_content text,
  intervention_at timestamptz,
  intervention_by uuid references auth.users(id),
  reassessment_nrs smallint check (reassessment_nrs between 0 and 10),
  reassessment_notes text,
  reassessment_at timestamptz,
  reassessment_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pain_records_user_id_idx on public.pain_records(user_id);
create index if not exists pain_records_status_idx on public.pain_records(status);
create index if not exists pain_records_created_at_idx on public.pain_records(created_at desc);
create index if not exists pain_records_user_created_idx on public.pain_records(user_id, created_at desc);
create unique index if not exists pain_records_case_code_uidx on public.pain_records(case_code);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email,''), '@', 1), '使用者'),
    'user'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = case when public.profiles.display_name = '' then excluded.display_name else public.profiles.display_name end,
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure private.handle_new_user();

-- 回補本 SQL 執行前已存在的 Auth 帳號。
insert into public.profiles (id, email, display_name, role)
select
  u.id,
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data ->> 'display_name', split_part(coalesce(u.email,''), '@', 1), '使用者'),
  'user'
from auth.users u
on conflict (id) do nothing;

create or replace function private.fill_internal_case_code()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if new.case_code is null or btrim(new.case_code) = '' then
    new.case_code := 'internal-' || replace(new.id::text, '-', '');
  end if;
  return new;
end;
$$;

drop trigger if exists pain_records_fill_case_code on public.pain_records;
create trigger pain_records_fill_case_code
before insert on public.pain_records
for each row execute function private.fill_internal_case_code();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

drop trigger if exists pain_records_set_updated_at on public.pain_records;
create trigger pain_records_set_updated_at before update on public.pain_records
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.pain_records enable row level security;

-- 清理本專案同名 Policy，避免重跑衝突。
drop policy if exists profiles_select_self_or_admin on public.profiles;
drop policy if exists pain_records_select_owner_or_admin on public.pain_records;
drop policy if exists pain_records_insert_owner on public.pain_records;

create policy profiles_select_self_or_admin
on public.profiles for select
to authenticated
using (id = auth.uid() or private.is_admin());

create policy pain_records_select_owner_or_admin
on public.pain_records for select
to authenticated
using (user_id = auth.uid() or private.is_admin());

create policy pain_records_insert_owner
on public.pain_records for insert
to authenticated
with check (
  user_id = auth.uid()
  and status = 'pending_intervention'
  and coalesce(cardinality(intervention_methods), 0) = 0
  and intervention_content is null
  and intervention_at is null
  and intervention_by is null
  and reassessment_nrs is null
  and reassessment_notes is null
  and reassessment_at is null
  and reassessment_by is null
);

-- 權限：前端可查詢；一般使用者僅能 INSERT 原始評估欄位。
revoke all on public.profiles from anon, authenticated;
revoke all on public.pain_records from anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.pain_records to authenticated;
grant insert (
  user_id, nrs, location, location_other, qualities, quality_other,
  frequency, pain_started_at, duration_value, duration_unit, notes
) on public.pain_records to authenticated;

-- 管理者處置 RPC：一般使用者沒有 UPDATE table 權限，只能由此函式受控更新。
create or replace function public.admin_save_intervention(
  p_record_id uuid,
  p_methods text[],
  p_content text,
  p_intervention_at timestamptz
)
returns public.pain_records
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_record public.pain_records;
begin
  if not private.is_admin() then
    raise exception '沒有管理者權限' using errcode = '42501';
  end if;
  if p_methods is null or cardinality(p_methods) = 0 then
    raise exception '至少需要一項處置方式';
  end if;
  if p_content is null or btrim(p_content) = '' then
    raise exception '處置內容不可空白';
  end if;
  update public.pain_records
  set intervention_methods = p_methods,
      intervention_content = p_content,
      intervention_at = coalesce(p_intervention_at, now()),
      intervention_by = auth.uid(),
      status = 'pending_reassessment'
  where id = p_record_id and status = 'pending_intervention'
  returning * into v_record;
  if v_record.id is null then raise exception '找不到待處置紀錄'; end if;
  return v_record;
end;
$$;

create or replace function public.admin_save_reassessment(
  p_record_id uuid,
  p_nrs smallint,
  p_notes text,
  p_reassessment_at timestamptz
)
returns public.pain_records
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
declare
  v_record public.pain_records;
begin
  if not private.is_admin() then
    raise exception '沒有管理者權限' using errcode = '42501';
  end if;
  if p_nrs < 0 or p_nrs > 10 then raise exception 'NRS 必須介於 0 到 10'; end if;
  update public.pain_records
  set reassessment_nrs = p_nrs,
      reassessment_notes = nullif(btrim(coalesce(p_notes,'')), ''),
      reassessment_at = coalesce(p_reassessment_at, now()),
      reassessment_by = auth.uid(),
      status = 'completed'
  where id = p_record_id and status = 'pending_reassessment'
  returning * into v_record;
  if v_record.id is null then raise exception '找不到待複評紀錄'; end if;
  return v_record;
end;
$$;

revoke all on function public.admin_save_intervention(uuid,text[],text,timestamptz) from public;
revoke all on function public.admin_save_reassessment(uuid,smallint,text,timestamptz) from public;
grant execute on function public.admin_save_intervention(uuid,text[],text,timestamptz) to authenticated;
grant execute on function public.admin_save_reassessment(uuid,smallint,text,timestamptz) to authenticated;
