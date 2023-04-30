create table links (
    code char(6) primary key,
    name text not null,
    gamemode text not null check (gamemode <> ''),
    theme text not null check (theme <> ''),
    record_when timestamp not null,
    data jsonb not null
);