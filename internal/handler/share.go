package handler

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/go-chi/httplog/v2"
	"github.com/tmaxmax/popthegrid/internal/share"
	"schneider.vip/problem"
)

type shareHandler struct {
	records RecordsRepository
}

func (s shareHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	record, ok := s.unmarshalPost(w, r)
	if !ok {
		return
	}

	l := httplog.LogEntry(r.Context())

	code, err := s.records.Save(r.Context(), record)
	if err != nil {
		l.ErrorContext(r.Context(), "save record", "err", err, "record", record)
		problem.Of(http.StatusInternalServerError).Append(problem.Detail("something went wrong")).WriteTo(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	encodeIndent(w, map[string]any{
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
		problem.Of(http.StatusBadRequest).Append(problem.Detail("invalid input")).WriteTo(w)
		return share.Record{}, false
	}

	return input, true
}

func encodeIndent(w io.Writer, v any) {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		panic(err)
	}
}
