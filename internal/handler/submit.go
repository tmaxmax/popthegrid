package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/go-chi/httplog/v2"
	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/attempt"
	"github.com/tmaxmax/popthegrid/internal/handler/session"
	"github.com/tmaxmax/popthegrid/internal/handler/sessionrand"
	"github.com/tmaxmax/popthegrid/internal/httpx"
	"github.com/tmaxmax/popthegrid/internal/trace"
	"schneider.vip/problem"
)

type AttemptsRepository interface {
	Submit(ctx context.Context, att *attempt.Attempt, tr *trace.Trace) (uuid.UUID, error)
}

type submitHandler struct {
	atts    AttemptsRepository
	randKey []byte
}

func (s submitHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if _, ok := session.Get(r.Context()); !ok {
		problem.Of(http.StatusUnauthorized).WriteTo(w)
		return
	}

	l := httplog.LogEntry(r.Context())

	in, err := s.unmarshal(r)
	if err != nil {
		l.Warn("invalid input", "err", err)
		problem.Of(http.StatusBadRequest).Append(problem.Detail("invalid input"), problem.WrapSilent(err)).WriteTo(w)
		return
	}

	if in.RandSignature.Signature != "" && !sessionrand.Verify(in.Attempt.RandState.Rand, in.RandSignature, s.randKey, time.Now()) {
		problem.Of(http.StatusUnauthorized).Append(problem.Detail("attempt random function does not match signature")).WriteTo(w)
		return
	}

	// TODO: verify attempt

	id, err := s.atts.Submit(r.Context(), &in.Attempt, &in.Trace)
	if err != nil {
		httplog.LogEntry(r.Context()).Error("save attempt", "err", err, "attempt", in.Attempt)
		problem.Of(http.StatusInternalServerError).Append(problem.WrapSilent(err)).WriteTo(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	httpx.JSON(w, map[string]any{
		"id": id,
	})
}

type submitInput struct {
	Attempt       attempt.Attempt
	Trace         trace.Trace
	RandSignature sessionrand.Signature
}

func (submitHandler) unmarshal(r *http.Request) (*submitInput, error) {
	var in submitInput
	var pevs []byte

	rd, err := r.MultipartReader()
	if err != nil {
		return nil, fmt.Errorf("open multipart form: %w", err)
	}

	for {
		p, err := rd.NextPart()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}

			return nil, fmt.Errorf("read multipart form: %w", err)
		}

		switch p.FormName() {
		case "attempt":
			if err := json.NewDecoder(p).Decode(&in.Attempt); err != nil {
				return nil, fmt.Errorf("decode attempt: %w", err)
			}
		case "trace":
			if err := json.NewDecoder(p).Decode(&in.Trace); err != nil {
				return nil, fmt.Errorf("decode trace: %w", err)
			}
		case "pointer-events":
			pevs, err = io.ReadAll(p)
			if err != nil {
				return nil, fmt.Errorf("read pointer events: %w", err)
			}
		case "rand":
			if err := json.NewDecoder(p).Decode(&in.RandSignature); err != nil {
				return nil, fmt.Errorf("decode rand signature: %w", err)
			}
		default:
			return nil, fmt.Errorf("unknown form value %q", p.FormName())
		}
	}

	if err := in.Trace.SetPointerEvents(pevs); err != nil {
		return nil, fmt.Errorf("set trace pointer events: %w", err)
	}

	return &in, nil
}
