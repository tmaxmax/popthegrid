package handler

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"

	"github.com/go-chi/httplog"
	"github.com/tmaxmax/popthegrid/internal/share"
	"schneider.vip/problem"
)

type Handler struct {
	Records RecordsRepository
}

func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	l := httplog.LogEntry(r.Context())

	var err error
	switch r.Method {
	case http.MethodGet:
		code, ok := h.unmarshalGet(w, r)
		if !ok {
			return
		}

		l.Info().Str("code", string(code)).Msg("Get code")

		err = h.get(w, r, code)
	case http.MethodPost:
		record, ok := h.unmarshalPost(w, r)
		if !ok {
			return
		}

		l := httplog.LogEntry(r.Context())
		l.Info().Interface("record", record).Msg("New record")

		err = h.post(w, r, record)
	default:
		panic("unreachable")
	}

	if err == nil {
		return
	}

	l.Err(err).Send()

	var p *problem.Problem
	var rerr RepositoryError
	if errors.As(err, &rerr) {
		switch rerr.Kind {
		case ErrorNotFound:
			p = problem.Of(http.StatusNotFound).Append(problem.Detail("no record for code"))
		default:
			p = problem.Of(http.StatusInternalServerError).Append(problem.Detail("something went wrong"))
		}

		p.Append(problem.Wrap(rerr))

	} else {
		p = problem.Of(http.StatusInternalServerError).Append(problem.Wrap(err), problem.Detail("something went wrong"))
	}

	p.WriteHeaderTo(w)
	p.WriteTo(w)
}

func (h *Handler) unmarshalGet(w http.ResponseWriter, r *http.Request) (share.Code, bool) {
	code := share.Code(r.URL.Query().Get("code"))
	if err := code.Validate(); err != nil {
		p := problem.Of(http.StatusBadRequest).Append(problem.Wrap(err), problem.Detail("invalid code"))
		p.WriteHeaderTo(w)
		p.WriteTo(w)

		return "", false
	}

	return code, true
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request, code share.Code) error {
	record, err := h.Records.Get(r.Context(), code)
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	return encodeIndent(w, record)
}

func (h *Handler) unmarshalPost(w http.ResponseWriter, r *http.Request) (share.Record, bool) {
	defer r.Body.Close()

	var input share.Record
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		p := problem.Of(http.StatusBadRequest).Append(problem.Wrap(err), problem.Detail("invalid input, must be JSON"))
		p.WriteHeaderTo(w)
		p.WriteTo(w)

		return share.Record{}, false
	}

	if err := input.Validate(); err != nil {
		p := problem.Of(http.StatusBadRequest).Append(problem.Wrap(err), problem.Detail("invalid input"))
		p.WriteHeaderTo(w)
		p.WriteTo(w)

		return share.Record{}, false
	}

	return input, true
}

func (h *Handler) post(w http.ResponseWriter, r *http.Request, record share.Record) error {
	code, err := h.Records.Save(r.Context(), record)
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	return encodeIndent(w, map[string]any{
		"code": code,
	})
}

func encodeIndent(w io.Writer, v any) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}
