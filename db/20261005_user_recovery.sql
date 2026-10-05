alter table app_users
add column if not exists is_active boolean not null default true;

update app_users
set is_active = true
where is_active is null;
