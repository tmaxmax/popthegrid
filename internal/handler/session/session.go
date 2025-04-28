package session

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"math/rand/v2"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/crypto/macval"
	"github.com/tmaxmax/popthegrid/internal/httpx"
)

const cookieName = "session"

type Handler struct {
	Secret, RandSecret []byte
	Expiry             time.Duration
}

type randPayload struct {
	Signature string `json:"randSignature"`
	State     Rand   `json:"randState"`
}

func (s Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	resp := map[string]any{"challenge": nil}

	payload, exp, ok := getInternal(r.Context())
	if !ok || exp {
		var givenRand randPayload
		var validGivenRand bool
		if err := json.NewDecoder(r.Body).Decode(&givenRand); err == nil {
			validGivenRand = givenRand.State.Match(givenRand.Signature, s.RandSecret)
		}

		payload.ID = uuid.Must(uuid.NewV4())
		if validGivenRand {
			payload.Rand = givenRand.State
		} else {
			payload.Rand = NewRand()
			resp["rand"] = payload.Rand
		}
	}

	payload.Exp = time.Now().Add(s.Expiry)

	http.SetCookie(w, payload.cookie(s.Secret))
	w.WriteHeader(http.StatusOK)
	httpx.JSON(w, resp)
}

func (s Handler) retrieve(r *http.Request, now time.Time) (Payload, bool, error) {
	c, err := r.Cookie(cookieName)
	if err == http.ErrNoCookie {
		return Payload{}, false, nil
	}

	var payload Payload
	if err := macval.From(c.Value, macval.Options{Algorithm: sha256.New, Key: s.Secret}, &payload); err != nil {
		return Payload{}, false, err
	}

	return payload, payload.Exp.Before(now), nil
}

type contextKey struct{}

type contextPayload struct {
	Payload
	expired bool
}

func (s Handler) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		payload, expired, err := s.retrieve(r, time.Now())
		if err != nil || payload.Exp.IsZero() {
			var id [8]byte
			binary.LittleEndian.PutUint64(id[:], rand.Uint64())

			r.Header.Set(middleware.RequestIDHeader, "anon/"+idReplacer.Replace(base64.RawURLEncoding.EncodeToString(id[:])))
			next.ServeHTTP(w, r)
			return
		}

		id := "sess/" + payload.id()
		if expired {
			id += "+exp"
		}

		r.Header.Set(middleware.RequestIDHeader, id)

		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), contextKey{}, contextPayload{Payload: payload, expired: expired})))
	})
}

func Get(ctx context.Context) (Payload, bool) {
	p, exp, ok := getInternal(ctx)
	if !ok || exp {
		return Payload{}, false
	}

	return p, true
}

func getInternal(ctx context.Context) (Payload, bool, bool) {
	p, ok := ctx.Value(contextKey{}).(contextPayload)
	return p.Payload, p.expired, ok
}
