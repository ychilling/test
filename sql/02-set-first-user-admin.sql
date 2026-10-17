-- 將最早建立的 Auth 帳號設為管理者。
-- 建議：先從前端申請第一個帳號，再執行本檔。
with first_user as (
  select id from auth.users order by created_at asc limit 1
)
update public.profiles p
set role = 'admin', updated_at = now()
from first_user f
where p.id = f.id
returning p.id, p.email, p.display_name, p.role;
