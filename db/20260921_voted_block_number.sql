alter table records
add column if not exists voted boolean not null default false;

alter table records
add column if not exists block_number text not null default '';
