-- ============================================
-- 安裝與安全檢查
-- ============================================

-- 1. 確認資料表與 RLS
select 'profiles' as item, count(*)::text as value
from public.profiles

union all

select 'pain_records', count(*)::text
from public.pain_records

union all

select 'profiles RLS', relrowsecurity::text
from pg_class
where oid = 'public.profiles'::regclass

union all

select 'pain_records RLS', relrowsecurity::text
from pg_class
where oid = 'public.pain_records'::regclass;


-- 2. 確認 RLS Policies
select
  schemaname,
  tablename,
  policyname,
  roles,
  cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'pain_records')
order by tablename, policyname;


-- 3. 確認 Triggers
select
  trigger_schema,
  event_object_table,
  trigger_name,
  action_timing,
  event_manipulation
from information_schema.triggers
where
     (
       trigger_schema = 'public'
       and event_object_table in ('profiles', 'pain_records')
     )
  or (
       trigger_schema = 'auth'
       and event_object_table = 'users'
     )
order by
  trigger_schema,
  event_object_table,
  trigger_name;


-- 4. 確認 Functions
select
  routine_schema,
  routine_name,
  security_type
from information_schema.routines
where
     (
       routine_schema = 'public'
       and routine_name in (
         'admin_save_intervention',
         'admin_save_reassessment'
       )
     )
  or (
       routine_schema = 'private'
       and routine_name in (
         'is_admin',
         'handle_new_user',
         'fill_internal_case_code',
         'set_updated_at'
       )
     )
order by
  routine_schema,
  routine_name;


-- 5. 確認 Table 權限
select
  grantee,
  table_name,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('profiles', 'pain_records')
  and grantee in ('anon', 'authenticated')
order by
  table_name,
  grantee,
  privilege_type;


-- 6. 確認 pain_records 欄位層級 INSERT 權限
select
  rcg.grantee,
  rcg.table_name,
  rcg.column_name,
  rcg.privilege_type
from information_schema.role_column_grants rcg
join information_schema.columns c
  on c.table_schema = rcg.table_schema
 and c.table_name = rcg.table_name
 and c.column_name = rcg.column_name
where rcg.table_schema = 'public'
  and rcg.table_name = 'pain_records'
  and rcg.grantee = 'authenticated'
  and rcg.privilege_type = 'INSERT'
order by c.ordinal_position;