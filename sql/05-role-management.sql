-- 角色管理範本。請把指定 Email 改成實際帳號後，再單獨執行需要的區塊。

-- A. user -> admin
update public.profiles
set role='admin', updated_at=now()
where lower(email)=lower('replace-with-user@example.com')
returning id,email,display_name,role;

-- B. admin -> user
-- 為避免誤執行，預設註解；需要時移除 /* */ 並修改 Email。
/*
update public.profiles
set role='user', updated_at=now()
where lower(email)=lower('replace-with-admin@example.com')
returning id,email,display_name,role;
*/

-- C. 查看目前角色
select id,email,display_name,role,created_at
from public.profiles
order by created_at;
