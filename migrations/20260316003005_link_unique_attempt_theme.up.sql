create table links_new (
    code text primary key,
    name text not null,
    theme text not null,
    attempt_id uuid not null references attempts, 
    created_at timestamp not null,
    data jsonb not null,
    unique (attempt_id, theme)
);

insert into links_new select code, name, theme, attempt_id, created_at, data from links;

drop table links;

alter table links_new rename to links;