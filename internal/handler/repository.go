package handler

import (
	"context"
	"fmt"

	"github.com/tmaxmax/popthegrid/internal/share"
)

type RecordsRepository interface {
	Save(ctx context.Context, record share.Record) (share.Code, error)
	Get(ctx context.Context, code share.Code) (share.Record, error)
}

type ErrorKind string

const (
	ErrorNotFound ErrorKind = "not found"
	ErrorInternal ErrorKind = "internal"
)

type RepositoryError struct {
	Kind  ErrorKind
	Cause error
}

func (r RepositoryError) Error() string {
	return fmt.Sprintf("%s: %v", r.Kind, r.Cause)
}

func (r RepositoryError) Unwrap() error {
	return r.Cause
}
