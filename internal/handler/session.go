package handler

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/rand"
	"encoding/base64"
	"encoding/gob"
	"fmt"
	"hash"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v2"
	"go.uber.org/atomic"
	"schneider.vip/problem"
)

type sessionPayload struct {
	Salt [8]byte
	IP   string
	Exp  time.Time
}

func (s sessionPayload) id() string {
	return base64.RawURLEncoding.EncodeToString(s.Salt[:])
}

func (s sessionPayload) toCookieValue(hm func() hash.Hash) string {
	var b bytes.Buffer
	if err := gob.NewEncoder(&b).Encode(s); err != nil {
		panic(err)
	}

	h := hm()
	h.Write(b.Bytes())

	signature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))
	data := base64.RawURLEncoding.EncodeToString(b.Bytes())

	return data + "." + signature
}

func (s *sessionPayload) fromRaw(data []byte) error {
	return gob.NewDecoder(bytes.NewReader(data)).Decode(s)
}

type sessionHandler struct {
	hmac   func() hash.Hash
	expiry time.Duration
}

func (s sessionHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	now := time.Now()

	c, err := r.Cookie(s.cookieName())
	if err == http.ErrNoCookie {
		http.SetCookie(w, s.gen(r.RemoteAddr, now))
		w.WriteHeader(http.StatusOK)
		return
	}

	data, valid := s.verify(c.Value)
	if !valid {
		problem.Of(http.StatusBadRequest).Append(problem.Detail("malformed session, please refresh")).WriteTo(w)
		return
	}

	var payload sessionPayload
	if err := payload.fromRaw(data); err != nil {
		httplog.LogEntry(r.Context()).ErrorContext(r.Context(), "session decode failure after signature check", "err", err)
		problem.Of(http.StatusInternalServerError).Append(problem.Detail("something went wrong, please refresh")).WriteTo(w)
		return
	}

	if payload.Exp.Before(now) {
		httplog.LogEntry(r.Context()).WarnContext(r.Context(), "received expired session", "delta", now.Sub(payload.Exp))
		http.SetCookie(w, s.gen(r.RemoteAddr, now))
		w.WriteHeader(http.StatusOK)
		return
	}

	payload.Exp = now.Add(s.expiry)

	http.SetCookie(w, &http.Cookie{
		Name:     s.cookieName(),
		Value:    payload.toCookieValue(s.hmac),
		Expires:  payload.Exp,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
	w.WriteHeader(http.StatusOK)
}

func (s sessionHandler) verify(value string) ([]byte, bool) {
	data, signature, ok := strings.Cut(value, ".")
	if !ok {
		return nil, false
	}

	dataRaw, err := base64.RawURLEncoding.DecodeString(data)
	signatureRaw, serr := base64.RawURLEncoding.DecodeString(signature)

	if err != nil || serr != nil {
		return nil, false
	}

	h := s.hmac()
	h.Write(dataRaw)

	return dataRaw, hmac.Equal(h.Sum(nil), signatureRaw)
}

func (s sessionHandler) gen(realIP string, now time.Time) *http.Cookie {
	var payload sessionPayload

	rand.Read(payload.Salt[:])
	payload.Exp = now.Add(s.expiry)
	payload.IP = realIP

	return &http.Cookie{
		Name:     s.cookieName(),
		Value:    payload.toCookieValue(s.hmac),
		Expires:  payload.Exp,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	}
}

func (sessionHandler) cookieName() string {
	return "session"
}

func (s sessionHandler) middleware(mandatory bool) func(next http.Handler) http.Handler {
	hostname, _ := os.Hostname()
	if hostname == "" {
		hostname = "localhost"
	}

	var cnt atomic.Int64

	type key struct{}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if valid, alreadyVerified := r.Context().Value(key{}).(bool); alreadyVerified {
				if !valid && mandatory {
					problem.Of(http.StatusUnauthorized).WriteTo(w)
				} else {
					next.ServeHTTP(w, r)
				}

				return
			}

			c, err := r.Cookie(s.cookieName())
			if err == http.ErrNoCookie {
				if mandatory {
					problem.Of(http.StatusUnauthorized).WriteTo(w)
				} else {
					next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), key{}, false)))
				}

				return
			}

			data, valid := s.verify(c.Value)
			if !valid {
				if mandatory {
					problem.Of(http.StatusUnauthorized).WriteTo(w)
				} else {
					next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), key{}, false)))
				}

				return
			}

			var payload sessionPayload
			if err := payload.fromRaw(data); err != nil {
				problem.Of(http.StatusInternalServerError).Append(problem.WrapSilent(err), problem.Detail("something went wrong, please retry")).WriteTo(w)
				return
			}

			if payload.Exp.Before(time.Now()) {
				if mandatory {
					problem.Of(http.StatusUnauthorized).WriteTo(w)
				} else {
					next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), key{}, false)))
				}
			}

			requestID := fmt.Sprintf("%s/id-%s/%d", hostname, payload.id(), cnt.Inc())
			r.Header.Set(middleware.RequestIDHeader, requestID)
			ctx := context.WithValue(r.Context(), key{}, true)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
