create table links_new (
    code text primary key,
    name text not null,
    theme text not null,
    attempt_id uuid not null unique references attempts, 
    created_at timestamp not null,
    data jsonb not null,
);

insert into links_new
select l.code, l.name, l.theme, l.attempt_id, l.created_at, l.data from links l
    left join links ll on l.attempt_id = ll.attempt_id and l.created_at > ll.created_at
where ll.created_at is null;

drop table links;

alter table links_new rename to links;