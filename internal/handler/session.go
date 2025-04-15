package handler

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"net/http"
	"slices"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/crypto/macval"
)

const sessionCookieName = "session"

type sessionContextKey struct{}

type sessionPayload struct {
	ID  uuid.UUID
	Exp time.Time
}

func (s sessionPayload) id() string {
	return base64.RawURLEncoding.EncodeToString(s.ID[:])
}

func (s sessionPayload) cookie(secret []byte) *http.Cookie {
	val, _ := macval.To(s, macval.Options{Algorithm: sha256.New, Key: secret})

	return &http.Cookie{
		Name:     sessionCookieName,
		Value:    val,
		Expires:  s.Exp,
		Secure:   true,
		HttpOnly: true,
		SameSite: http.SameSiteStrictMode,
	}
}

func (s sessionPayload) MarshalBinary() ([]byte, error) {
	return s.Exp.AppendBinary(slices.Clone(s.ID[:]))
}

func (s *sessionPayload) UnmarshalBinary(data []byte) error {
	if len(data) < uuid.Size {
		return errors.New("invalid session payload")
	}

	return errors.Join(
		s.ID.UnmarshalBinary(data[:uuid.Size]),
		s.Exp.UnmarshalBinary(data[uuid.Size:]),
	)
}

type sessionHandler struct {
	secret []byte
	expiry time.Duration
}

func (s sessionHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	now := time.Now()

	payload, ok := r.Context().Value(sessionContextKey{}).(sessionPayload)
	if !ok {
		payload.ID = uuid.Must(uuid.NewV4())
	}

	payload.Exp = now.Add(s.expiry)

	http.SetCookie(w, payload.cookie(s.secret))
	w.WriteHeader(http.StatusOK)
}

func (s sessionHandler) retrieve(r *http.Request, now time.Time) (sessionPayload, error) {
	c, err := r.Cookie(sessionCookieName)
	if err == http.ErrNoCookie {
		return sessionPayload{}, nil
	}

	var payload sessionPayload
	if err := macval.From(c.Value, macval.Options{Algorithm: sha256.New, Key: s.secret}, &payload); err != nil {
		return sessionPayload{}, err
	}

	if payload.Exp.Before(now) {
		return sessionPayload{}, nil
	}

	return payload, nil
}

func (s sessionHandler) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		payload, err := s.retrieve(r, time.Now())
		if err != nil || payload.Exp.IsZero() {
			var id [8]byte
			rand.Read(id[:])

			r.Header.Set(middleware.RequestIDHeader, "anon/"+base64.RawURLEncoding.EncodeToString(id[:]))
			next.ServeHTTP(w, r)
			return
		}

		r.Header.Set(middleware.RequestIDHeader, "sess/"+payload.id())

		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), sessionContextKey{}, payload)))
	})
}
