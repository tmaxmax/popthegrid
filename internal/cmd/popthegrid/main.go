package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"fmt"
	"hash"
	"io/fs"
	"net/http"
	"os"
	"os/signal"
	"time"

	"github.com/go-chi/httplog/v2"
	"github.com/olivere/vite"
	"github.com/rs/cors"
	resources "github.com/tmaxmax/popthegrid"
	"github.com/tmaxmax/popthegrid/internal/cmd/internal"
	"github.com/tmaxmax/popthegrid/internal/handler"
	"github.com/tmaxmax/popthegrid/internal/repo/sqlite"
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

	db, err := internal.CreateDB(ctx, env.Database, resources.Migrations)
	if err != nil {
		return err
	}
	defer db.Close()

	dist, _ := fs.Sub(resources.Dist, "dist")
	assets, _ := fs.Sub(resources.Dist, "dist/assets")
	public, _ := fs.Sub(resources.Public, "public")

	v, err := vite.HTMLFragment(vite.Config{
		FS: dist,
	})
	if err != nil {
		return fmt.Errorf("create Vite fragment: %w", err)
	}

	h := handler.New(handler.Config{
		AssetsTags:       v.Tags,
		Assets:           handler.FS{Data: assets, Path: "/assets/"},
		Public:           handler.FS{Data: public, Path: "/static/"},
		Records:          &sqlite.Repository{DB: db},
		RecordStorageKey: env.RecordStorageKey,
		CORS: cors.Options{
			AllowedOrigins: []string{env.URL},
			AllowedMethods: []string{http.MethodGet, http.MethodPost},
		},
		Logger: httplog.Options{
			LogLevel:       env.LogLevel,
			JSON:           true,
			Concise:        true,
			RequestHeaders: true,
			Writer:         os.Stderr,
		},
		HMAC:          func() hash.Hash { return hmac.New(sha256.New, env.HMACSecret) },
		SessionExpiry: env.SessionExpiry,
	})

	s := &http.Server{
		Addr:        "0.0.0.0:" + env.Port,
		Handler:     h,
		ReadTimeout: time.Second * 10,
	}

	return internal.RunServer(ctx, s)
}
