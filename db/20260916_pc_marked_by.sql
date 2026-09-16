alter table records
add column if not exists pc_marked_by text not null default '';
