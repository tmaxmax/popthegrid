package handler

import (
	"encoding/json"
	"io"
	"net/http"

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

	code, err := s.records.Save(r.Context(), record)
	if err != nil {
		problem.Of(http.StatusInternalServerError).Append(problem.Wrap(err)).WriteTo(w)
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

	var input share.Record
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		problem.Of(http.StatusBadRequest).Append(problem.Wrap(err), problem.Detail("invalid input, must be JSON")).WriteTo(w)
		return share.Record{}, false
	}

	if err := input.Validate(); err != nil {
		problem.Of(http.StatusBadRequest).Append(problem.Wrap(err), problem.Detail("invalid input")).WriteTo(w)
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
