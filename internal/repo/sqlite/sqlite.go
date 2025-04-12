package sqlite

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/share"
	"modernc.org/sqlite"
	sqlite3 "modernc.org/sqlite/lib"
)

type Repository struct {
	DB *sql.DB
}

func (r *Repository) Get(ctx context.Context, code share.Code) (share.Record, error) {
	var rec share.Record

	row := r.DB.QueryRowContext(ctx, "select name, gamemode, theme, record_when, data from links where code = $1", string(code))
	err := row.Scan(&rec.Name, &rec.Gamemode, &rec.Theme, &rec.When, (*recordData)(&rec.Data))
	if err == sql.ErrNoRows {
		return share.Record{}, createError(handler.ErrorNotFound, err)
	} else if err != nil {
		return share.Record{}, createError(handler.ErrorInternal, err)
	}

	return rec, nil
}

func (r *Repository) Save(ctx context.Context, record share.Record) (share.Code, error) {
	src := rand.NewSource(time.Now().UnixNano())
	for range 10 {
		code := share.NewCode(src)

		ok, err := r.trySaveWithCode(ctx, record, code)
		if ok {
			return code, nil
		} else if err != nil {
			return "", err
		}
	}

	return "", createError(handler.ErrorInternal, errors.New("couldn't create unique code"))
}

func (r *Repository) trySaveWithCode(ctx context.Context, record share.Record, code share.Code) (bool, error) {
	const query = `insert into links (code, name, gamemode, theme, record_when, data) values ($1, $2, $3, $4, $5, $6)`

	tx, err := r.DB.BeginTx(ctx, nil)
	if err != nil {
		return false, err
	}
	defer tx.Rollback()

	_, err = tx.ExecContext(ctx, query, code, record.Name, record.Gamemode, record.Theme, record.When, recordData(record.Data))
	if err == nil {
		if err := tx.Commit(); err != nil {
			return false, createError(handler.ErrorInternal, err)
		}

		return true, nil
	}

	var sqerr *sqlite.Error
	if errors.As(err, &sqerr) {
		if sqerr.Code() == sqlite3.SQLITE_CONSTRAINT_PRIMARYKEY {
			return false, nil
		}
	}

	return false, createError(handler.ErrorInternal, err)
}

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
