package handler

import (
	_ "embed"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"net/http"
	"strconv"

	"github.com/go-chi/httplog/v2"
	"github.com/tmaxmax/popthegrid/internal/share"
)

type codeRenderer struct {
	records    RecordsRepository
	index      *template.Template
	storageKey string
}

func (c codeRenderer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	l := httplog.LogEntry(r.Context())

	code := share.Code(r.PathValue("code"))
	if err := code.Validate(); err != nil {
		c.error(w, code, http.StatusNotFound)
		return
	}

	record, err := c.records.Get(r.Context(), code)
	if err != nil {
		var rerr RepositoryError
		var statusCode int

		if errors.As(err, &rerr) && rerr.Kind == ErrorNotFound {
			statusCode = http.StatusNotFound
		} else {
			l.ErrorContext(r.Context(), "get record", "err", err)
			statusCode = http.StatusInternalServerError
		}

		c.error(w, code, statusCode)
		return
	}

	http.SetCookie(w, c.cookie(code, 0))

	data := defaultIndex()
	data.OG.URL += "/" + string(code)
	data.Description = record.Description()
	data.Objective = data.Description

	b, _ := json.Marshal(record)
	data.Script = template.JS(fmt.Sprintf("sessionStorage.setItem('%s', '%s')", c.storageKey, b))

	img := &data.OG.Image
	img.Path = fmt.Sprintf("/static/og/%s-%s.jpg", record.Gamemode, record.Theme)
	img.Type = "image/jpeg"
	img.Width = 1200
	img.Height = 627
	img.Alt = fmt.Sprintf("Pop the grid: %s", record.Gamemode.Description())

	data.Robots = "noindex"

	renderIndex(w, http.StatusOK, c.index, data)
}

func (c codeRenderer) error(w http.ResponseWriter, code share.Code, statusCode int) {
	http.SetCookie(w, c.cookie(code, statusCode))
	renderIndex(w, statusCode, c.index, defaultIndex())
}

func (codeRenderer) cookie(code share.Code, statusCode int) *http.Cookie {
	c := &http.Cookie{
		Name:     "status",
		Path:     "/" + string(code),
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	}

	if statusCode == 0 {
		c.MaxAge = -1
	} else {
		c.MaxAge = 15
		c.Value = strconv.Itoa(statusCode)
	}

	return c
}

//go:embed index.go.html
var indexHTML string

type indexData struct {
	Description string
	Objective   string
	OG          struct {
		URL   string
		Image struct {
			Path   string
			Type   string
			Width  int
			Height int
			Alt    string
		}
	}
	Robots string
	Script template.JS
}

func defaultIndex() indexData {
	var data indexData

	data.Description = "Pop all the squares in the grid. Will you make it?"
	data.Objective = "Objective: pop all the squares in the grid. Will you make it?"
	data.OG.URL = "https://popthegrid.com"

	return data
}

func renderIndex(w http.ResponseWriter, statusCode int, index *template.Template, data indexData) {
	w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
	w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
	w.WriteHeader(statusCode)

	if err := index.Execute(w, data); err != nil {
		panic(err)
	}
}
