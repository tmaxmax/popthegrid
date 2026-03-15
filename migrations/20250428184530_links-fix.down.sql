create table links_old (
    code char(6) primary key,
    name text not null,
    gamemode text not null check (gamemode <> ''),
    theme text not null check (theme <> ''),
    record_when timestamp not null,
    data jsonb not null
);

insert into links_old
select links.code, links.name, attempts.gamemode, links.theme, attempts.started_at, attempts.record_data
from links
    join attempts on attempts.id = links.attempt_id;

drop table links;

alter table links_old rename to links;