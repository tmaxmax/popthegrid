package handler

import (
	"html/template"
	"io/fs"
	"net/http"

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

	return cors.New(c.CORS).Handler(m)
}
