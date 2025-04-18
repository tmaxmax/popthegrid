package altcha

import (
	"encoding/base64"
	"encoding/json"
	"net/http"
	"net/url"
	"time"

	"github.com/tmaxmax/popthegrid/internal/httpx"
	"schneider.vip/problem"
)

const keyResource = "resource"

type Handler struct {
	HMACKey []byte
	Exempt  func(r *http.Request) bool
}

func (h *Handler) WithChallenge(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if h.Exempt(r) {
			next.ServeHTTP(w, r)
			return
		}

		enc := r.Header.Get("X-Pow-Challenge")
		if enc == "" {
			httpx.JSON(w, h.create(r))
			return
		}

		raw, err := base64.StdEncoding.DecodeString(enc)
		if err != nil {
			problem.Of(http.StatusBadRequest).Append(problem.WrapSilent(err), problem.Detail("invalid challenge response")).WriteTo(w)
			return
		}

		var payload Payload
		if err := json.Unmarshal(raw, &payload); err != nil {
			problem.Of(http.StatusBadRequest).Append(problem.WrapSilent(err), problem.Detail("invalid challenge response")).WriteTo(w)
			return
		}

		if err := h.verify(r, payload); err != nil {
			problem.Of(http.StatusUnauthorized).Append(problem.Wrap(err), problem.Detail("incorrect challenge response")).WriteTo(w)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func (h *Handler) create(r *http.Request) Challenge {
	exp := time.Now().Add(time.Second * 10)

	opts := ChallengeOptions{
		Algorithm:  SHA256,
		MaxNumber:  200000,
		SaltLength: 12,
		Params:     url.Values{},
		HMACKey:    h.HMACKey,
	}
	opts.Expires = &exp
	opts.Params.Set(keyResource, r.URL.Path)

	return CreateChallenge(opts)
}

func (h *Handler) verify(r *http.Request, payload Payload) error {
	if extractParams(payload).Get(keyResource) != r.URL.Path {
		return ErrWrong
	}

	return VerifySolution(payload, h.HMACKey, true)
}
