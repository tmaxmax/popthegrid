package sqlite

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/attempt"
	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/share"
	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

type Repository struct {
	DB *sql.DB
}

func (r *Repository) Get(ctx context.Context, code share.Code) (share.Record, error) {
	const query = `select
	links.name, attempts.gamemode, links.theme, attempts.started_at, links.data,
	case when attempts.verification = 'UNKNOWN' then null else attempts.id end
from links
	join attempts on attempts.id = links.attempt_id
where code = $1`

	var rec share.Record

	row := r.DB.QueryRowContext(ctx, query, string(code))
	err := row.Scan(&rec.Name, &rec.Gamemode, &rec.Theme, &rec.When, (*recordData)(&rec.Data), &rec.AttemptID)
	if err == sql.ErrNoRows {
		return share.Record{}, createError(handler.ErrorNotFound, err)
	} else if err != nil {
		return share.Record{}, createError(handler.ErrorInternal, err)
	}

	return rec, nil
}

func (r *Repository) Save(ctx context.Context, record share.Record) (share.Code, error) {
	now := time.Now()

	for range 10 {
		code := share.NewCode()

		ok, err := r.trySaveWithCode(ctx, record, code, now)
		if ok {
			return code, nil
		} else if err != nil {
			return "", err
		}
	}

	return "", createError(handler.ErrorInternal, errors.New("couldn't create unique code"))
}

func (r *Repository) trySaveWithCode(ctx context.Context, record share.Record, code share.Code, now time.Time) (bool, error) {
	const query = `insert into links (code, name, theme, attempt_id, data, created_at) values ($1, $2, $3, $4, $5, $6)`

	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	if !record.AttemptID.Valid {
		record.AttemptID.UUID, err = attemptFromRecord(ctx, tx, record, now)
		if err != nil {
			return false, fmt.Errorf("create attempt: %w", err)
		}
	} else {
		var kind attempt.Kind
		if err := tx.QueryRowContext(ctx, "select kind from attempts where verification <> 'UNKNOWN' and id = $1", record.AttemptID.UUID).Scan(&kind); err != nil {
			if errors.Is(err, sql.ErrNoRows) {
				return false, createError(handler.ErrorNotFound, err)
			}
		}

		if kind != attempt.Win {
			return false, createError(handler.ErrorNotWin, nil)
		}
	}

	_, err = tx.ExecContext(ctx, query, code, record.Name, record.Theme, record.AttemptID.UUID, recordData(record.Data), now)
	if err == nil {
		if err := tx.Commit(); err != nil {
			return false, createError(handler.ErrorInternal, err)
		}

		return true, nil
	}

	var sqerr *sqlite.Error
	if errors.As(err, &sqerr) {
		switch sqerr.Code() {
		case sqlite3.SQLITE_CONSTRAINT_PRIMARYKEY:
			return false, nil
		case sqlite3.SQLITE_CONSTRAINT_FOREIGNKEY:
			return false, createError(handler.ErrorNotFound, err)
		case sqlite3.SQLITE_CONSTRAINT_UNIQUE:
			return false, createError(handler.ErrorAlreadySubmitted, err)
		}
	}

	return false, createError(handler.ErrorInternal, err)
}

func (r *Repository) Submit(ctx context.Context, att attempt.Attempt, trace json.RawMessage) (uuid.UUID, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return uuid.Nil, fmt.Errorf("gen id: %w", err)
	}

	const query = `insert into attempts (id, gamemode, started_at, kind, num_squares, duration_ms, rand_state, trace, created_at) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`
	_, err = r.DB.ExecContext(ctx, query, id, att.Gamemode, att.StartedAt, att.Kind, att.NumSquares, att.DurationMs, randState(att.RandState), trace, time.Now())
	if err != nil {
		// TODO: handle particular error cases (ID conflict).
		return uuid.Nil, fmt.Errorf("insert: %w", err)
	}

	return id, nil
}

func (r *Repository) Ping(ctx context.Context) error { return r.DB.PingContext(ctx) }

func createError(kind handler.ErrorKind, err error) handler.RepositoryError {
	return handler.RepositoryError{
		Kind:  kind,
		Cause: err,
	}
}

type recordData share.RecordData

func (r recordData) Value() (driver.Value, error) {
	return json.Marshal(r)
}

func (r *recordData) Scan(src any) error {
	b, ok := src.([]byte)
	if !ok {
		return fmt.Errorf("unexpected recordData source type %T", src)
	}

	return json.Unmarshal(b, r)
}

func attemptFromRecord(ctx context.Context, tx *sql.Tx, record share.Record, now time.Time) (uuid.UUID, error) {
	id, err := uuid.NewV4()
	if err != nil {
		return uuid.Nil, fmt.Errorf("gen id: %w", err)
	}

	if _, err := tx.ExecContext(
		ctx,
		"insert into attempts (id, gamemode, started_at, num_squares, kind, created_at, verification) values ($1, $2, $3, $4, $5, $6, $7)",
		id, record.Gamemode, record.When, 48, "WIN", now, "UNKNOWN",
	); err != nil {
		return uuid.Nil, fmt.Errorf("insert: %w", err)
	}

	return id, nil
}

type randState attempt.RandState

func (r randState) Value() (driver.Value, error) {
	return json.Marshal(r)
}

func (r *randState) Scan(src any) error {
	b, ok := src.([]byte)
	if !ok {
		return fmt.Errorf("unexpected randState source type %T", src)
	}

	return json.Unmarshal(b, r)
}
