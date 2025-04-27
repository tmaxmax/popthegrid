package handler

import (
	"context"
	"fmt"
	"html/template"
	"io/fs"
	"net/http"
	"net/netip"
	"path/filepath"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v2"
	"github.com/rs/cors"
	"github.com/tmaxmax/popthegrid/internal/crypto/altcha"
	"github.com/tmaxmax/popthegrid/internal/handler/session"
)

type FS struct {
	Data fs.FS
	Path string
}

func (f FS) register(m *http.ServeMux) {
	m.Handle("GET "+f.Path, http.StripPrefix(f.Path, http.FileServerFS(f.Data)))
}

func (f FS) readdir(paths []string) ([]string, error) {
	root, err := fs.ReadDir(f.Data, ".")
	if err != nil {
		return nil, err
	}

	for _, p := range root {
		pt := filepath.Join(f.Path, p.Name())
		if p.IsDir() {
			s, err := fs.Sub(f.Data, p.Name())
			if err != nil {
				return nil, err
			}

			paths, err = FS{Data: s, Path: pt}.readdir(paths)
			if err != nil {
				return nil, err
			}
		} else {
			paths = append(paths, pt)
		}
	}

	return paths, nil
}

type Repository interface {
	RecordsRepository
	PingRepository
}

type Config struct {
	AssetsTags       template.HTML
	Assets           FS
	Public           FS
	Repository       Repository
	RecordStorageKey string
	CORS             cors.Options
	Logger           httplog.Options
	SessionSecret    []byte
	SessionExpiry    time.Duration
	RegisterVite     func(*http.ServeMux)
}

func New(c Config) http.Handler {
	m := http.NewServeMux()

	m.Handle("GET /health", healthHandler{ping: c.Repository})

	c.Assets.register(m)
	c.Public.register(m)

	var staticPaths []string
	staticPaths, _ = c.Assets.readdir(staticPaths)
	staticPaths, _ = c.Public.readdir(staticPaths)

	m.HandleFunc("GET /manifest.json", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/manifest+json")
		http.ServeFileFS(w, r, c.Public.Data, "manifest.json")
	})

	index := template.Must(template.
		New("index").
		Funcs(template.FuncMap{
			"Tags": func() template.HTML {
				return c.AssetsTags
			},
		}).
		Parse(indexHTML))

	m.Handle("GET /{code}", codeRenderer{
		records:    c.Repository,
		storageKey: c.RecordStorageKey,
		index:      index,
	})
	m.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		renderIndex(w, http.StatusOK, index, defaultIndex())
	})

	pow := altcha.NewHandler(altcha.HandlerConfig{
		HMACKey: c.SessionSecret,
		Exempt: func(r *http.Request) bool {
			_, ok := session.Get(r.Context())
			return ok
		},
		ID: func(r *http.Request) ([]byte, error) {
			header := "X-Real-Ip"
			if c.CORS.Debug {
				header = "X-Forwarded-For"
			}
			return netip.MustParseAddr(r.Header.Get(header)).MarshalBinary()
		},
	})
	go pow.Start(context.TODO())

	sess := session.Handler{
		Secret: c.SessionSecret,
		Expiry: c.SessionExpiry,
	}

	m.Handle("POST /session", pow.WithChallenge(sess))

	m.Handle("POST /share", shareHandler{records: c.Repository})

	if c.RegisterVite != nil {
		c.RegisterVite(m)
	}

	logger := httplog.NewLogger("popthegrid", c.Logger)
	if c.CORS.Logger == nil {
		c.CORS.Logger = corsLogger{l: logger}
	}

	return chi.Chain(
		sess.Middleware,
		middleware.RequestID,
		middleware.RealIP,
		httplog.Handler(logger, staticPaths),
		middleware.Recoverer,
		cors.New(c.CORS).Handler,
	).Handler(http.MaxBytesHandler(m, 1<<14))
}

type corsLogger struct {
	l *httplog.Logger
}

// Printf implements cors.Logger.
func (c corsLogger) Printf(format string, args ...any) {
	c.l.Debug(fmt.Sprintf(format, args...))
}
