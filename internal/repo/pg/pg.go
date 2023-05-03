package pg

import (
	"context"
	"errors"
	"math/rand"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/share"
)

type Repository struct {
	Config *pgx.ConnConfig
}

func (r *Repository) Get(ctx context.Context, code share.Code) (share.Record, error) {
	conn, err := r.connect(ctx)
	if err != nil {
		return share.Record{}, err
	}
	defer disconnect(conn)

	var rec share.Record

	row := conn.QueryRow(ctx, "select name, gamemode, theme, record_when, data from links where code = $1", string(code))
	err = row.Scan(&rec.Name, &rec.Gamemode, &rec.Theme, &rec.When, &rec.Data)
	if err == pgx.ErrNoRows {
		return share.Record{}, createError(handler.ErrorNotFound, err)
	} else if err != nil {
		return share.Record{}, createError(handler.ErrorInternal, err)
	}

	return rec, nil
}

func (r *Repository) Save(ctx context.Context, record share.Record) (share.Code, error) {
	conn, err := r.connect(ctx)
	if err != nil {
		return "", err
	}
	defer disconnect(conn)

	tx, err := conn.Begin(ctx)
	if err != nil {
		return "", createError(handler.ErrorInternal, err)
	}
	defer rollbackWithTimeout(tx)

	src := rand.NewSource(time.Now().UnixNano())
	for i := 0; i < 10; i++ {
		code := share.NewCode(src)

		ok, err := r.trySaveWithCode(ctx, tx, record, code)
		if ok {
			if err := commitWithTimeout(tx); err != nil {
				return "", createError(handler.ErrorInternal, err)
			}

			return code, nil
		} else if err != nil {
			return "", err
		}
	}

	return "", createError(handler.ErrorInternal, errors.New("couldn't create unique code"))
}

func (r *Repository) trySaveWithCode(ctx context.Context, tx pgx.Tx, record share.Record, code share.Code) (bool, error) {
	const query = `insert into links (code, name, gamemode, theme, record_when, data) values ($1, $2, $3, $4, $5, $6)`

	ptx, err := tx.Begin(ctx)
	if err != nil {
		return false, createError(handler.ErrorInternal, err)
	}
	defer rollbackWithTimeout(ptx)

	_, err = ptx.Exec(ctx, query, code, record.Name, record.Gamemode, record.Theme, record.When, record.Data)
	if err == nil {
		if err := commitWithTimeout(ptx); err != nil {
			return false, createError(handler.ErrorInternal, err)
		}

		return true, nil
	}

	var pgerr *pgconn.PgError
	if errors.As(err, &pgerr) {
		if pgerr.ConstraintName == "links_pkey" {
			return false, nil
		}
	}

	return false, createError(handler.ErrorInternal, err)
}

func (r *Repository) connect(ctx context.Context) (*pgx.Conn, error) {
	conn, err := pgx.ConnectConfig(ctx, r.Config)
	if err != nil {
		return nil, handler.RepositoryError{
			Kind:  handler.ErrorInternal,
			Cause: err,
		}
	}

	m := conn.TypeMap()
	m.RegisterDefaultPgType(map[string]any{}, "jsonb")
	m.RegisterDefaultPgType(share.Code(""), "char")
	m.RegisterDefaultPgType(share.Gamemode(""), "text")
	m.RegisterDefaultPgType(share.Theme(""), "text")

	return conn, nil
}

func createError(kind handler.ErrorKind, err error) handler.RepositoryError {
	return handler.RepositoryError{
		Kind:  kind,
		Cause: err,
	}
}

func disconnect(conn *pgx.Conn) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := conn.Close(ctx); err != nil {
		panic(err)
	}
}

func rollbackWithTimeout(tx pgx.Tx) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := tx.Rollback(ctx); err != nil && err != pgx.ErrTxClosed {
		panic(err)
	}
}

func commitWithTimeout(tx pgx.Tx) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	return tx.Commit(ctx)
}
