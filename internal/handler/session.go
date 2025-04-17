package handler

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"slices"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v2"
	"github.com/gofrs/uuid"
	"github.com/tmaxmax/popthegrid/internal/crypto/altcha"
	"github.com/tmaxmax/popthegrid/internal/crypto/macval"
	"schneider.vip/problem"
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
	secret    []byte
	expiry    time.Duration
	challenge altcha.ChallengeOptions
}

func (s sessionHandler) GET(w http.ResponseWriter, r *http.Request) {
	exp := time.Now().Add(time.Second * 10)
	opts := s.challenge
	opts.Expires = &exp
	opts.Params = url.Values{}
	opts.Params.Set("resource", "session")

	if _, ok := s.retrieveFromContext(r); ok {
		// Speedrun challenge for already authenticated users that have first opened the page.
		// We have no way to update client's state to not request a challenge so we make it very simple.
		// This case is expected to appear especially when opening links from friends.
		opts.Number = 1
	}

	encodeIndent(w, altcha.CreateChallenge(opts))
}

func (s sessionHandler) POST(w http.ResponseWriter, r *http.Request) {
	payload, ok := s.retrieveFromContext(r)
	if !ok {
		if err := s.verifyChallenge(r); err != nil {
			problem.Of(http.StatusUnauthorized).Append(problem.WrapSilent(err), problem.Detail("challenge not passed")).WriteTo(w)
			return
		}

		payload.ID = uuid.Must(uuid.NewV4())
	}

	payload.Exp = time.Now().Add(s.expiry)

	http.SetCookie(w, payload.cookie(s.secret))
	w.WriteHeader(http.StatusOK)
}

func (s sessionHandler) verifyChallenge(r *http.Request) error {
	defer r.Body.Close()

	var payload altcha.Payload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		return err
	}

	if err := payload.Algorithm.Validate(); err != nil {
		return err
	}

	if altcha.ExtractParams(payload).Get("resource") != "session" {
		return altcha.ErrWrong
	}

	l := httplog.LogEntry(r.Context())
	if err := altcha.VerifySolution(payload, s.challenge.HMACKey, true); err != nil {
		l.WarnContext(r.Context(), "challenge failed", "err", err)
		return err
	}

	l.InfoContext(r.Context(), "challenge passed", "took", payload.Duration())

	return nil
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

func (s sessionHandler) retrieveFromContext(r *http.Request) (sessionPayload, bool) {
	p, ok := r.Context().Value(sessionContextKey{}).(sessionPayload)
	return p, ok
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
