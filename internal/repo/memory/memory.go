package memory

import (
	"context"
	"errors"
	"math/rand"
	"os"
	"time"

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
	src := rand.NewSource(time.Now().UnixNano())
	for i := 0; i < 10; i++ {
		code := share.NewCode(src)
		if _, ok := r.Data[code]; ok {
			continue
		}

		r.Data[code] = record

		return code, nil
	}

	return "", handler.RepositoryError{
		Kind:  handler.ErrorInternal,
		Cause: errors.New("couldn't generate unique code"),
	}

}

func (*Repository) Ping(context.Context) error { return os.ErrClosed }
