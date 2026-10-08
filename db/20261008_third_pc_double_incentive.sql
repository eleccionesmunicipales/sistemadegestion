alter table records
add column if not exists benefit_type_3 text not null default '',
add column if not exists amount_3 numeric not null default 0,
add column if not exists passed_pc_3 boolean not null default false,
add column if not exists pc_marked_by_3 text not null default '';
