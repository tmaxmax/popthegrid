package handler

import (
	"fmt"
	"html/template"
	"io/fs"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/httplog/v2"
	"github.com/rs/cors"
)

type FS struct {
	Data fs.FS
	Path string
}

func (f FS) register(m *http.ServeMux) {
	m.Handle("GET "+f.Path, http.StripPrefix(f.Path, http.FileServerFS(f.Data)))
}

type Config struct {
	AssetsTags       template.HTML
	Assets           FS
	Public           FS
	Records          RecordsRepository
	RecordStorageKey string
	CORS             cors.Options
	Logger           httplog.Options
}

func New(c Config) http.Handler {
	m := http.NewServeMux()

	c.Assets.register(m)
	c.Public.register(m)

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
		records:    c.Records,
		storageKey: c.RecordStorageKey,
		index:      index,
	})
	m.HandleFunc("GET /", func(w http.ResponseWriter, r *http.Request) {
		renderIndex(w, index, defaultIndex(r))
	})
	m.Handle("POST /share", shareHandler{records: c.Records})

	logger := httplog.NewLogger("popthegrid", c.Logger)
	if c.CORS.Logger == nil {
		c.CORS.Logger = corsLogger{l: logger}
	}

	return chi.Chain(
		middleware.RequestID,
		middleware.RealIP,
		httplog.Handler(logger, []string{c.Assets.Path, c.Public.Path}),
		middleware.Recoverer,
		cors.New(c.CORS).Handler,
	).Handler(m)
}

type corsLogger struct {
	l *httplog.Logger
}

// Printf implements cors.Logger.
func (c corsLogger) Printf(format string, args ...any) {
	c.l.Debug(fmt.Sprintf(format, args...))
}
