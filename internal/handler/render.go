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
	"github.com/tmaxmax/popthegrid/internal/handler/session"
	"github.com/tmaxmax/popthegrid/internal/share"
)

type codeRenderer struct {
	records    RecordsRepository
	renderer   renderer
	storageKey string
}

func (c codeRenderer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	l := httplog.LogEntry(r.Context())

	code := share.Code(r.PathValue("code"))
	if err := code.Validate(); err != nil {
		c.error(w, r, code, http.StatusNotFound)
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

		c.error(w, r, code, statusCode)
		return
	}

	http.SetCookie(w, c.cookie(code, 0))

	data := defaultIndex()
	data.OG.URL += "/" + string(code)
	data.Description = record.Description()
	data.Objective = data.Description

	b, _ := json.Marshal(record)
	data.SessionStorage[template.JSStr(c.storageKey)] = template.JSStr(b)

	img := &data.OG.Image
	img.Path = fmt.Sprintf("/static/og/%s-%s.jpg", record.Gamemode, record.Theme)
	img.Type = "image/jpeg"
	img.Width = 1200
	img.Height = 627
	img.Alt = fmt.Sprintf("Pop the grid: %s", record.Gamemode.Description())

	data.Robots = "noindex"

	c.renderer.renderIndex(w, r, http.StatusOK, data)
}

func (c codeRenderer) error(w http.ResponseWriter, r *http.Request, code share.Code, statusCode int) {
	http.SetCookie(w, c.cookie(code, statusCode))
	c.renderer.renderIndex(w, r, statusCode, defaultIndex())
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
	Robots         string
	SessionStorage map[template.JSStr]template.JSStr
}

func defaultIndex() indexData {
	var data indexData

	data.Description = "Pop all the squares in the grid. Will you make it?"
	data.Objective = "Objective: pop all the squares in the grid. Will you make it?"
	data.OG.URL = "https://popthegrid.com"
	data.SessionStorage = map[template.JSStr]template.JSStr{}

	return data
}

type renderer struct {
	randKey []byte
	index   *template.Template
}

func (r renderer) renderIndex(w http.ResponseWriter, req *http.Request, statusCode int, data indexData) {
	var randSignature string
	var randState session.Rand

	if sess, ok := session.Get(req.Context()); ok {
		randState = sess.Rand
	} else {
		randState = session.NewRand()
		randSignature = randState.Signature(r.randKey)
	}

	data.SessionStorage["rand"] = jsonStr(randState)
	if len(randSignature) > 0 {
		data.SessionStorage["randSignature"] = template.JSStr(randSignature)
	}

	w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
	w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
	w.WriteHeader(statusCode)

	if err := r.index.Execute(w, data); err != nil {
		panic(err)
	}
}

func jsonStr(v any) template.JSStr {
	b, _ := json.Marshal(v)
	return template.JSStr(b)
}
