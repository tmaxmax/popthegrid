create table links_new (
    code text primary key,
    name text not null,
    theme text not null,
    -- the 'mystery' game mode isn't correctly mapped, as its record
    -- should be mapped to multiple attempts for proper verification.
    attempt_id uuid not null unique references attempts, 
    created_at timestamp not null,
    data jsonb not null
);

insert into links_new select code, name, theme, attempt_id, created_at, data from links;

drop table links;

alter table links_new rename to links;