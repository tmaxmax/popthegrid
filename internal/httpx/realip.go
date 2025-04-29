package httpx

import (
	"net/http"

	"github.com/realclientip/realclientip-go"
	"schneider.vip/problem"
)

func TrustedXForwardedFor(next http.Handler) http.Handler {
	s, _ := realclientip.NewRightmostNonPrivateStrategy("X-Forwarded-For")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rip := s.ClientIP(r.Header, r.RemoteAddr)
		if rip == "" {
			problem.Of(http.StatusUnauthorized).WriteTo(w)
		} else {
			r.RemoteAddr = rip
			next.ServeHTTP(w, r)
		}
	})
}
