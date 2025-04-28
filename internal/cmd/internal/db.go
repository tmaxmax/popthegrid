package internal

import (
	"context"
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/golang-migrate/migrate/v4"
	msqlite "github.com/golang-migrate/migrate/v4/database/sqlite"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/tmaxmax/popthegrid/internal/repo/sqlite"
	_ "modernc.org/sqlite"
)

func CreateDB(ctx context.Context, path string, migrations fs.FS) (*sql.DB, error) {
	if dir := filepath.Dir(path); dir != "." {
		if err := os.MkdirAll(dir, 0o666); err != nil {
			return nil, fmt.Errorf("create DB dir: %w", err)
		}
	}

	pragmas := []struct{ key, value string }{
		{"busy_timeout", "10000"},
		{"journal_mode", "WAL"},
		{"journal_size_limit", "200000000"},
		{"synchronous", "OFF"},
		{"foreign_keys", "ON"},
		{"temp_store", "MEMORY"},
		{"cache_size", "-16000"},
	}

	pragma := "?"
	for i, p := range pragmas {
		if i > 0 {
			pragma += "&"
		}

		pragma += fmt.Sprintf("_pragma=%s(%s)", p.key, p.value)
	}

	db, err := sql.Open("sqlite", path+pragma)
	if err != nil {
		return nil, fmt.Errorf("open: %w", err)
	}

	md, err := msqlite.WithInstance(db, &msqlite.Config{})
	if err != nil {
		return nil, fmt.Errorf("open migration driver: %w", err)
	}

	fd, err := iofs.New(migrations, "migrations")
	if err != nil {
		return nil, fmt.Errorf("open migration files: %w", err)
	}
	defer fd.Close()

	m, err := migrate.NewWithInstance("embedFiles", fd, "sqlite", md)
	if err != nil {
		return nil, fmt.Errorf("create migration engine: %w", err)
	}

	cancel := context.AfterFunc(ctx, func() { m.GracefulStop <- true })
	defer cancel()

	version, dirty, err := m.Version()
	if err == nil && !dirty {
		switch version {
		case 1:
			if err := m.Steps(1); err != nil {
				return nil, fmt.Errorf("migrate to version 2: %w", err)
			}

			if err := sqlite.FromV1ToV2(ctx, db); err != nil {
				return nil, fmt.Errorf("v1 to v2 migration script: %w", err)
			}
		}
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		return nil, fmt.Errorf("migrate up: %w", err)
	}

	return db, nil
}
