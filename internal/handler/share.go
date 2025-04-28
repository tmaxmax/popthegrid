package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/httplog/v2"
	"github.com/tmaxmax/popthegrid/internal/handler/session"
	"github.com/tmaxmax/popthegrid/internal/httpx"
	"github.com/tmaxmax/popthegrid/internal/share"
	"schneider.vip/problem"
)

type shareHandler struct {
	records RecordsRepository
}

func (s shareHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if _, ok := session.Get(r.Context()); !ok {
		problem.Of(http.StatusUnauthorized).WriteTo(w)
		return
	}

	record, ok := s.unmarshalPost(w, r)
	if !ok {
		return
	}

	l := httplog.LogEntry(r.Context())

	code, err := s.records.Save(r.Context(), record)
	if err != nil {
		statusCode := http.StatusInternalServerError
		var opts []problem.Option

		if rerr := (RepositoryError{}); errors.As(err, &rerr) {
			switch rerr.Kind {
			case ErrorNotFound:
				statusCode = http.StatusNotFound
			case ErrorAlreadySubmitted, ErrorNotWin:
				statusCode = http.StatusBadRequest
			default:
			}

			opts = append(opts, problem.Detail(string(rerr.Kind)))
		}

		if statusCode == http.StatusInternalServerError {
			l.ErrorContext(r.Context(), "save record", "err", err, "record", record)
		}

		opts = append(opts, problem.WrapSilent(err))
		problem.Of(statusCode).Append(opts...).WriteTo(w)

		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	httpx.JSON(w, map[string]any{
		"code": code,
	})
}

func (s shareHandler) unmarshalPost(w http.ResponseWriter, r *http.Request) (share.Record, bool) {
	defer r.Body.Close()

	l := httplog.LogEntry(r.Context())

	var input share.Record
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		l.WarnContext(r.Context(), "decode input", "err", err)
		problem.Of(http.StatusBadRequest).Append(problem.Detail("invalid input, must be JSON")).WriteTo(w)
		return share.Record{}, false
	}

	if err := input.Validate(); err != nil {
		l.WarnContext(r.Context(), "validation error", "err", err)
		problem.Of(http.StatusBadRequest).Append(problem.Detail("invalid input"), problem.Wrap(err)).WriteTo(w)
		return share.Record{}, false
	}

	return input, true
}
