package handler

import (
	"context"
	"encoding/json"
	"net/http"

	"github.com/go-chi/httplog/v2"
	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/attempt"
	"github.com/tmaxmax/popthegrid/internal/handler/session"
	"github.com/tmaxmax/popthegrid/internal/httpx"
	"schneider.vip/problem"
)

type AttemptsRepository interface {
	Submit(ctx context.Context, att attempt.Attempt, trace json.RawMessage) (uuid.UUID, error)
}

type submitHandler struct {
	atts AttemptsRepository
}

type submitPayload struct {
	Attempt attempt.Attempt `json:"attempt"`
	Trace   json.RawMessage `json:"trace"`
}

func (s submitHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sess, ok := session.Get(r.Context())
	if !ok {
		problem.Of(http.StatusUnauthorized).WriteTo(w)
		return
	}

	l := httplog.LogEntry(r.Context())

	var payload submitPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		l.Warn("invalid JSON", "err", err)
		problem.Of(http.StatusBadRequest).Append(problem.Detail("invalid JSON input"), problem.WrapSilent(err)).WriteTo(w)
		return
	}

	if sess.Rand != payload.Attempt.RandState.Rand {
		l.Warn("mismatched rand", "sess", sess.Rand, "payload", payload.Attempt.RandState.Rand)
		problem.Of(http.StatusUnauthorized).Append(problem.Detail("this attempt doesn't come from your current session")).WriteTo(w)
		return
	}

	// TODO: verify attempt

	id, err := s.atts.Submit(r.Context(), payload.Attempt, payload.Trace)
	if err != nil {
		httplog.LogEntry(r.Context()).Error("save attempt", "err", err, "attempt", payload.Attempt)
		problem.Of(http.StatusInternalServerError).Append(problem.WrapSilent(err)).WriteTo(w)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	httpx.JSON(w, map[string]any{
		"id": id,
	})
}
