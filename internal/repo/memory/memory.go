package memory

import (
	"context"
	"errors"

	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/share"
)

type Repository struct {
	Data map[share.Code]share.Record
}

func (r *Repository) Get(ctx context.Context, code share.Code) (share.Record, error) {
	record, ok := r.Data[code]
	if !ok {
		return share.Record{}, handler.RepositoryError{
			Kind: handler.ErrorNotFound,
		}
	}

	return record, nil
}

func (r *Repository) Save(ctx context.Context, record share.Record) (share.Code, error) {
	return "", errors.New("unimplemented")
}
