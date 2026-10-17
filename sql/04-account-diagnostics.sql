-- 帳號診斷：Auth 與 Profile 是否一一對應
select
  u.id,
  u.email as auth_email,
  u.email_confirmed_at,
  u.created_at as auth_created_at,
  p.email as profile_email,
  p.display_name,
  p.role,
  case when p.id is null then 'MISSING_PROFILE' else 'OK' end as profile_status
from auth.users u
left join public.profiles p on p.id=u.id
order by u.created_at;

-- 若有 MISSING_PROFILE，可重新執行下列回補：
insert into public.profiles (id,email,display_name,role)
select u.id, coalesce(u.email,''), coalesce(u.raw_user_meta_data->>'display_name', split_part(coalesce(u.email,''),'@',1), '使用者'), 'user'
from auth.users u
left join public.profiles p on p.id=u.id
where p.id is null
on conflict (id) do nothing;
