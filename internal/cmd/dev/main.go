package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-chi/httplog/v2"
	"github.com/olivere/vite"
	"github.com/rs/cors"
	"github.com/tmaxmax/popthegrid/internal/cmd/internal"
	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/repo/memory"
	"github.com/tmaxmax/popthegrid/internal/share"
)

func main() {
	if err := run(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func run() error {
	ctx, cancel := signal.NotifyContext(context.Background(), os.Interrupt)
	defer cancel()

	env := internal.Getenv()
	dist := os.DirFS("dist")

	v, err := vite.HTMLFragment(vite.Config{
		FS:           dist,
		IsDev:        true,
		ViteEntry:    env.Entrypoint,
		ViteURL:      fmt.Sprintf("http://%s:5173", internal.LocalIP()),
		ViteTemplate: vite.SvelteTs,
	})
	if err != nil {
		return fmt.Errorf("create Vite fragment: %w", err)
	}

	h := handler.New(handler.Config{
		AssetsTags:       v.Tags,
		Assets:           handler.FS{Data: dist, Path: "/assets/"},
		Public:           handler.FS{Data: os.DirFS("public"), Path: "/static/"},
		Records:          &memory.Repository{Data: map[share.Code]share.Record{}},
		RecordStorageKey: env.RecordStorageKey,
		CORS: cors.Options{
			AllowedOrigins: []string{env.URL},
			AllowedMethods: []string{http.MethodGet, http.MethodPost},
			Debug:          true,
		},
		Logger: httplog.Options{
			LogLevel: env.LogLevel,
			Concise:  true,
			Writer:   os.Stderr,
		},
	})

	s := &http.Server{
		Addr:              "0.0.0.0:" + env.Port,
		Handler:           h,
		ReadHeaderTimeout: time.Second * 10,
	}

	return internal.RunServer(ctx, s)
}
