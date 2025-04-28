create table attempts (
    id uuid primary key,
    gamemode text not null check (gamemode <> ''),
    started_at timestamp not null, -- client timestamp
    kind attempt_kind not null, -- WIN, LOSE, ABORT
    num_squares integer not null check (num_squares > 0),
    duration_ms integer,
    rand_state jsonb check (verification = 'UNKNOWN' or rand_state is not null),
    trace jsonb check (verification = 'UNKNOWN' or trace is not null),
    created_at timestamp not null,
    updated_at timestamp,
    verification text not null default 'PENDING' -- PENDING, VALID, INVALID, UNKNOWN
);

alter table links add column created_at timestamp;
alter table links add column attempt_id uuid;