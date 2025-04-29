package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"

	"github.com/go-chi/httplog/v2"
	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/attempt"
	"github.com/tmaxmax/popthegrid/internal/handler/session"
	"github.com/tmaxmax/popthegrid/internal/httpx"
	"github.com/tmaxmax/popthegrid/internal/trace"
	"schneider.vip/problem"
)

type AttemptsRepository interface {
	Submit(ctx context.Context, att *attempt.Attempt, tr *trace.Trace) (uuid.UUID, error)
}

type submitHandler struct {
	atts AttemptsRepository
}

func (s submitHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sess, ok := session.Get(r.Context())
	if !ok {
		problem.Of(http.StatusUnauthorized).WriteTo(w)
		return
	}

	l := httplog.LogEntry(r.Context())

	attempt, trace, err := s.unmarshal(r)
	if err != nil {
		l.Warn("invalid input", "err", err)
		problem.Of(http.StatusBadRequest).Append(problem.Detail("invalid input"), problem.WrapSilent(err)).WriteTo(w)
		return
	}

	if sess.Rand != attempt.RandState.Rand {
		l.Warn("mismatched rand", "sess", sess.Rand, "payload", attempt.RandState.Rand)
		problem.Of(http.StatusUnauthorized).Append(problem.Detail("this attempt doesn't come from your current session")).WriteTo(w)
		return
	}

	// TODO: verify attempt

	id, err := s.atts.Submit(r.Context(), attempt, trace)
	if err != nil {
		httplog.LogEntry(r.Context()).Error("save attempt", "err", err, "attempt", attempt)
		problem.Of(http.StatusInternalServerError).Append(problem.WrapSilent(err)).WriteTo(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	httpx.JSON(w, map[string]any{
		"id": id,
	})
}

func (submitHandler) unmarshal(r *http.Request) (*attempt.Attempt, *trace.Trace, error) {
	var att attempt.Attempt
	var tr trace.Trace
	var pevs []byte

	rd, err := r.MultipartReader()
	if err != nil {
		return nil, nil, fmt.Errorf("open multipart form: %w", err)
	}

	for {
		p, err := rd.NextPart()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}

			return nil, nil, fmt.Errorf("read multipart form: %w", err)
		}

		switch p.FormName() {
		case "attempt":
			if err := json.NewDecoder(p).Decode(&att); err != nil {
				return nil, nil, fmt.Errorf("decode attempt: %w", err)
			}
		case "trace":
			if err := json.NewDecoder(p).Decode(&tr); err != nil {
				return nil, nil, fmt.Errorf("decode trace: %w", err)
			}
		case "pointer-events":
			pevs, err = io.ReadAll(p)
			if err != nil {
				return nil, nil, fmt.Errorf("read pointer events: %w", err)
			}
		default:
			return nil, nil, fmt.Errorf("unknown form value %q", p.FormName())
		}
	}

	if err := tr.SetPointerEvents(pevs); err != nil {
		return nil, nil, fmt.Errorf("set trace pointer events: %w", err)
	}

	return &att, &tr, nil
}
