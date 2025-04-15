package handler

import (
	"context"
	"net/http"

	"schneider.vip/problem"
)

type PingRepository interface {
	Ping(context.Context) error
}

type healthHandler struct {
	ping PingRepository
}

func (p healthHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if err := p.ping.Ping(r.Context()); err != nil {
		problem.Of(http.StatusInternalServerError).Append(problem.WrapSilent(err), problem.Detail("server not healthy")).WriteTo(w)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
