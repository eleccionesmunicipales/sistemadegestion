create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  username text not null unique,
  password text not null,
  function_name text not null default 'Sistema de Gestion',
  function_description text not null default '',
  role text not null default 'operator' check (role in ('admin', 'operator')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists records (
  id text primary key,
  first_names text not null default '',
  last_names text not null default '',
  full_name text not null default '',
  birth_date text not null default '',
  sex text not null default '',
  document_number text not null default '',
  polling_place text not null default '',
  table_number text not null default '',
  order_number text not null default '',
  neighborhood text not null default '',
  status text not null default '',
  status_lider text not null default '',
  benefit_type text not null default '',
  benefit_type_2 text not null default '',
  benefit_type_3 text not null default '',
  amount numeric not null default 0,
  amount_2 numeric not null default 0,
  amount_3 numeric not null default 0,
  city text not null default '',
  mobile_type text not null default '',
  passed_pc boolean not null default false,
  pc_marked_by text not null default '',
  passed_pc_2 boolean not null default false,
  pc_marked_by_2 text not null default '',
  passed_pc_3 boolean not null default false,
  pc_marked_by_3 text not null default '',
  voted boolean not null default false,
  block_number text not null default '',
  observation text not null default '',
  updated_by text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_label text not null default '',
  username text not null default '',
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

insert into app_users (first_name, last_name, username, password, function_name, function_description, role)
values ('Administrador', 'General', 'admin', 'admin123', 'Admin', 'Administrador principal del sistema', 'admin')
on conflict (username) do nothing;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists app_users_updated_at on app_users;
create trigger app_users_updated_at
before update on app_users
for each row execute function set_updated_at();

drop trigger if exists records_updated_at on records;
create trigger records_updated_at
before update on records
for each row execute function set_updated_at();

alter table app_users enable row level security;
alter table records enable row level security;
alter table audit_log enable row level security;
