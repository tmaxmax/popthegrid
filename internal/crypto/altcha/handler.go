package altcha

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"math"
	"net/http"
	"net/url"
	"sync"
	"time"

	"github.com/tmaxmax/popthegrid/internal/crypto/altcha/sketch"
	"github.com/tmaxmax/popthegrid/internal/httpx"
	"schneider.vip/problem"
)

const keyResource = "resource"

type HandlerConfig struct {
	HMACKey []byte
	Exempt  func(r *http.Request) bool
	ID      func(r *http.Request) ([]byte, error)
}

func NewHandler(config HandlerConfig) *Handler {
	// Params should be good for about 20k connections.
	reqs := sketch.New(0.00007, 0.001)

	return &Handler{
		reqs:    reqs,
		dcs:     reqs.Clone(),
		hmacKey: config.HMACKey,
		exempt:  config.Exempt,
		id:      config.ID,
		expiry:  time.Second * 10,
		window:  time.Second * 10,
	}
}

type Handler struct {
	reqs   *sketch.Sketch
	dcs    *sketch.Sketch
	mu     sync.Mutex
	expiry time.Duration
	window time.Duration

	hmacKey []byte
	exempt  func(r *http.Request) bool
	id      func(r *http.Request) ([]byte, error)
}

func (h *Handler) Start(ctx context.Context) {
	const decay = 2

	ticker := time.NewTicker(h.window)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			h.mu.Lock()

			for id, iw := range h.reqs.All() {
				reqs := h.reqs.At(id, iw)
				dcs := h.dcs.At(id, iw)
				if reqs <= decay {
					h.dcs.SetAt(id, iw, sketch.Sub(sketch.Add(dcs, reqs), decay))
				} else {
					v := uint32(min(math.Pow(1.01, float64(reqs-decay)), float64(math.MaxUint32)))
					h.dcs.SetAt(id, iw, sketch.Add(dcs, v))
				}
			}

			h.reqs.Reset()

			h.mu.Unlock()
		case <-ctx.Done():
			return
		}
	}
}

func (h *Handler) WithChallenge(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if h.exempt(r) {
			next.ServeHTTP(w, r)
			return
		}

		enc := r.Header.Get("X-Pow-Challenge")
		if enc == "" {
			id, err := h.id(r)
			if err != nil {
				problem.Of(http.StatusInternalServerError).Append(problem.WrapSilent(err)).WriteTo(w)
				return
			}

			httpx.JSON(w, h.create(id, r.URL.Path))
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

func (h *Handler) create(id []byte, resource string) Challenge {
	h.mu.Lock()
	h.reqs.Add(id, 2)
	difficulty := h.dcs.Count(id)
	h.mu.Unlock()

	exp := time.Now().Add(h.expiry)

	opts := ChallengeOptions{
		Algorithm:  SHA256,
		MaxNumber:  200000 + int64(difficulty),
		SaltLength: 12,
		Params:     url.Values{},
		HMACKey:    h.hmacKey,
	}
	opts.Expires = &exp
	opts.Params.Set(keyResource, resource)

	return CreateChallenge(opts)
}

func (h *Handler) verify(r *http.Request, payload Payload) error {
	if extractParams(payload).Get(keyResource) != r.URL.Path {
		return ErrWrong
	}

	return VerifySolution(payload, h.hmacKey, true)
}
