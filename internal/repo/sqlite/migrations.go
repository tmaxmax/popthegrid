package sqlite

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/tmaxmax/popthegrid/internal/share"
)

func FromV1ToV2(ctx context.Context, db *sql.DB) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	rows, err := tx.QueryContext(ctx, "select code, gamemode, theme, record_when from links")
	if err != nil {
		return fmt.Errorf("query links: %w", err)
	}
	defer rows.Close()

	type link struct {
		Code share.Code
		share.Record
	}

	var links []link
	for rows.Next() {
		var l link

		if err := rows.Scan(&l.Code, &l.Gamemode, &l.Theme, &l.When); err != nil {
			return fmt.Errorf("scan link: %w", err)
		}

		links = append(links, l)
	}

	now := time.Now()

	for _, l := range links {
		attemptID, err := attemptFromRecord(ctx, tx, l.Record, now)
		if err != nil {
			return fmt.Errorf("create attempt for link %q: %w", l.Code, err)
		}

		if _, err := tx.ExecContext(ctx, "update links set attempt_id = $1, created_at = $2 where code = $3", attemptID, l.When, l.Code); err != nil {
			return fmt.Errorf("update link %q: %w", l.Code, err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit: %w", err)
	}

	return nil
}
