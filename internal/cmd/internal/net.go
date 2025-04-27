package internal

import (
	"context"
	"errors"
	"net"
	"net/http"
	"time"
)

func RunServer(ctx context.Context, s *http.Server, l net.Listener) error {
	shutdownError := make(chan error)

	go func() {
		<-ctx.Done()

		sctx, cancel := context.WithTimeout(context.Background(), time.Second*10)
		defer cancel()

		shutdownError <- s.Shutdown(sctx)
	}()

	var err error
	if l != nil {
		err = s.Serve(l)
	} else {
		err = s.ListenAndServe()
	}

	if err != nil && !errors.Is(err, http.ErrServerClosed) && !errors.Is(err, net.ErrClosed) {
		return err
	}

	return <-shutdownError
}

func LocalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "localhost"
	}

	for _, a := range addrs {
		if ip, ok := a.(*net.IPNet); ok && !ip.IP.IsLoopback() {
			if ip.IP.To4() != nil {
				return ip.IP.String()
			}
		}
	}

	return "localhost"
}
