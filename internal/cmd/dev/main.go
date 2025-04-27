package main

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
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
	"golang.ngrok.com/ngrok"
	"golang.ngrok.com/ngrok/config"
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

	db, err := internal.CreateDB(ctx, env.Database, resources.Migrations)
	if err != nil {
		return err
	}
	defer db.Close()

	v, err := vite.HTMLFragment(vite.Config{
		FS:           dist,
		IsDev:        true,
		ViteEntry:    env.Entrypoint,
		ViteURL:      env.URL,
		ViteTemplate: vite.SvelteTs,
	})
	if err != nil {
		return fmt.Errorf("create Vite fragment: %w", err)
	}

	h := handler.New(handler.Config{
		AssetsTags:       v.Tags,
		Assets:           handler.FS{Data: dist, Path: "/assets/"},
		Public:           handler.FS{Data: os.DirFS("public"), Path: "/static/"},
		Repository:       &sqlite.Repository{DB: db},
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
		SessionSecret: env.HMACSecret,
		SessionExpiry: env.SessionExpiry,
		RegisterVite: func(m *http.ServeMux) {
			viteLocalhostURL, _ := url.Parse("http://localhost:5173")
			proxy := httputil.NewSingleHostReverseProxy(viteLocalhostURL)

			m.Handle("GET /vite", proxy)
			m.Handle("/@vite/", proxy)
			m.Handle("/src/", proxy)
			m.Handle("/node_modules/", proxy)
		},
	})

	l, err := ngrok.Listen(
		ctx,
		config.HTTPEndpoint(config.WithURL(env.URL)),
		ngrok.WithAuthtokenFromEnv(),
		ngrok.WithRegion("eu"),
	)
	if err != nil {
		return fmt.Errorf("create ngrok tunnel: %w", err)
	}

	s := &http.Server{
		Handler:           h,
		ReadHeaderTimeout: time.Second * 10,
	}

	fmt.Println("Open at", env.URL)

	return internal.RunServer(ctx, s, l)
}
