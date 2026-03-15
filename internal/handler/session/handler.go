package session

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
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
	Secret []byte
	Expiry time.Duration
}

func (s Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	sess := Session{
		ID:        uuid.Must(uuid.NewV4()),
		CreatedAt: time.Now(),
		Expiry:    s.Expiry,
	}

	http.SetCookie(w, sess.cookie(s.Secret))
	w.WriteHeader(http.StatusOK)
	httpx.JSON(w, map[string]any{"data": sess.expiry()})
}

func (s Handler) retrieve(r *http.Request, now time.Time) (Session, bool, error) {
	c, err := r.Cookie(cookieName)
	if err == http.ErrNoCookie {
		return Session{}, false, nil
	}

	var payload Session
	if err := macval.From(c.Value, macval.Options{Algorithm: sha256.New, Key: s.Secret}, &payload); err != nil {
		return Session{}, false, err
	}

	return payload, payload.CreatedAt.Add(payload.Expiry).Before(now), nil
}

type contextKey struct{}

func (s Handler) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sess, expired, err := s.retrieve(r, time.Now())
		if err != nil || expired {
			var id [8]byte
			binary.LittleEndian.PutUint64(id[:], rand.Uint64())

			r.Header.Set(middleware.RequestIDHeader, "anon/"+idReplacer.Replace(base64.RawURLEncoding.EncodeToString(id[:])))
			next.ServeHTTP(w, r)
			return
		}

		r.Header.Set(middleware.RequestIDHeader, "sess/"+sess.id())

		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), contextKey{}, sess)))
	})
}

func Get(ctx context.Context) (Session, bool) {
	p, ok := ctx.Value(contextKey{}).(Session)
	return p, ok
}
